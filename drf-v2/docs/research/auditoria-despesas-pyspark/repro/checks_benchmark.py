import ast
import csv
import json
import sys
import time
from decimal import Decimal
from pathlib import Path
from load_notebook import load_pipeline

sys.stdout.reconfigure(encoding='utf8')
lab=Path.cwd();ns,adaptation=load_pipeline(lab)
result={'adaptation':adaptation,'checks':[],'benchmarks':[],'fixture_id':6092026,'fixture_generation':'deterministic sequence, no RNG'}
def save(): (lab/'checks-benchmark-results.json').write_text(json.dumps(result,indent=2,ensure_ascii=False),encoding='utf8')
def check(name,expected,actual,kind='contract'):
    result['checks'].append({'name':name,'expected':expected,'actual':actual,'pass':expected==actual,'kind':kind});save()

# File checks use actual notebook functions, not reimplemented validators.
fixtures=lab/'fixtures';fixtures.mkdir(exist_ok=True)
for separator,label in [(';','semicolon'),(',','comma'),('\t','tab')]:
    f=fixtures/(label+'.csv')
    with f.open('w',encoding='utf8',newline='') as stream:
        writer=csv.writer(stream,delimiter=separator);writer.writerow(['Órgão Nome','Valor Liquidado','Valor Pago'])
        writer.writerows([['Órgão Sintético','1.234,56','100,00']]*40)
    check(label+' validation',True,ns['validar_csv_local'](f));check(label+' sniff',separator,ns['detectar_separador'](f))
f=fixtures/'invalid.html';f.write_text('<!DOCTYPE html><html>'+('unavailable '*200)+'</html>',encoding='utf8')
check('HTML rejected',False,ns['validar_csv_local'](f))
f=fixtures/'tiny-valid.csv';f.write_text('orgao_nome;valor_liquidado;valor_pago\nA;1,00;1,00\n',encoding='utf8')
check('small valid CSV accepted',True,ns['validar_csv_local'](f),'edge expectation; code minimum1024 bytes')

from pyspark.sql import SparkSession
from pyspark import SparkContext
from pyspark.sql.functions import col,sum as spark_sum,lit
spark=None
try:
    t=time.perf_counter()
    spark=(SparkSession.builder.master('local[2]').appName('Mission06_RealNotebookChecks').config('spark.driver.memory','2g').config('spark.driver.host','127.0.0.1').config('spark.driver.bindAddress','127.0.0.1').config('spark.driver.port','5283').config('spark.blockManager.port','5284').config('spark.ui.enabled','false').config('spark.sql.shuffle.partitions','8').config('spark.sql.adaptive.enabled','true').getOrCreate())
    result['startup_seconds']=time.perf_counter()-t;result['spark_version']=spark.version;result['initial_ansi']=spark.conf.get('spark.sql.ansi.enabled');spark.sparkContext.setLogLevel('ERROR');save()
    # Normal attempt under actual Spark4 default; save failure, then directed local
    # compatibility recovery without changing the notebook transformations.
    raw=spark.createDataFrame([('A','1,2,3')],['orgao_nome','valor_liquidado'])
    try:
        actual=ns['preparar_dataframe'](raw).select('valor_liquidado_limpo').first()[0]
        check('malformed monetary token under default ANSI',None,actual)
    except Exception as error:
        check('malformed monetary token under default ANSI','null and counted invalid',type(error).__name__,'runtime FAIL; conversion aborts under Spark4 ANSI')
        result['ansi_error_excerpt']=str(error)[:1200];save()
    spark.conf.set('spark.sql.ansi.enabled','false');result['recovery']='session-only ANSI=false for subsequent diagnostic/benchmark; no transformation rewrite';save()
    rows=[('A','R$ 1.234,56'),('A','10,00'),('B','2.50'),('B',None),('B','inválido'),(None,'5,00'),('','3,00'),('A','10,00')]
    df=ns['preparar_dataframe'](spark.createDataFrame(rows,'orgao_nome string, valor_liquidado string'))
    values=[r[0] for r in df.select('valor_liquidado_limpo').collect()] # only8 synthetic values, never public raw collection
    check('BR symbol, decimal-point, null, invalid', [1234.56,10.0,2.5,None,None,5.0,3.0,10.0],values)
    check('duplicate rows retained; no dedupe contract',8,df.count(),'characterization, not bug')
    check('missing required column rejected',True,False if 'orgao_nome' in ['unrelated'] else True,'checked below')
    try:ns['preparar_dataframe'](spark.createDataFrame([('A','1')],['different','valor_liquidado']));result['checks'][-1]['actual']=False;result['checks'][-1]['pass']=False
    except ValueError:pass
    # Double precision diagnostic independent of real financial expectations.
    precision=ns['preparar_dataframe'](spark.range(1000).select(lit('A').alias('orgao_nome'),lit('0,10').alias('valor_liquidado')))
    double_total=precision.agg(spark_sum('valor_liquidado_limpo')).first()[0]
    decimal_total=precision.agg(spark_sum(col('valor_liquidado_limpo').cast('decimal(20,2)'))).first()[0]
    result['precision']={'n':1000,'input_per_row':'0,10','expected_decimal':str(Decimal('0.10')*1000),'double_total':double_total,'decimal_cast_sum':str(decimal_total),'double_minus_decimal':str(Decimal(str(double_total))-decimal_total),'scope':'synthetic constant cents; diagnostic only, no claim of material public accounting error'};save()
    # Compile the exact notebook statements covering read -> prepare -> persist ->
    # count -> totals -> group/order/limit -> bounded toPandas. No rewrite.
    source=''.join(json.loads((lab/'analise.ipynb').read_text(encoding='utf8'))['cells'][2]['source']);tree=ast.parse(source)
    pipeline=next(node for node in tree.body if isinstance(node,ast.FunctionDef) and node.name=='executar_pipeline')
    guarded=next(node for node in pipeline.body if isinstance(node,ast.Try))
    selected=[node for node in guarded.body if node.lineno>=755 and node.end_lineno<=841]
    stage=compile(ast.fix_missing_locations(ast.Module(body=selected,type_ignores=[])),'analise.ipynb:cell2:755-841','exec')
    result['stage_scope']='Exact AST nodes cell2 lines755-841; CSV IO+normalization+persist/count+aggregate+top10 toPandas; no charts/exports/download/startup. Cold Spark cache each repeat; warm OS/JVM; source CSV read1partition; shuffle8 + AQE.'
    for n in [1000,10000,100000]:
        path=fixtures/f'benchmark-{n}.csv'
        with path.open('w',encoding='utf8',newline='') as stream:
            writer=csv.writer(stream,delimiter=';');writer.writerow(['orgao_nome','valor_liquidado','valor_pago'])
            for i in range(n):writer.writerow([f'Órgão {i%20:02}','123,45','100,00'])
        raw_times=[];internal_times=[];partitions=[];topn=[]
        for repeat in range(4): # first full action = warmup; three measured repetitions
            ctx=dict(ns);ctx.update(spark=spark,ARQUIVO_LOCAL=path,separador=';');t=time.perf_counter();exec(stage,ctx);wall=time.perf_counter()-t
            try:
                assert ctx['linhas_processadas']==n
                assert abs(ctx['total_liquidado']-n*123.45)<0.01
                assert abs(ctx['total_pago']-n*100.0)<0.01
                assert len(ctx['pdf_top_orgaos'])==10
                assert abs(ctx['pdf_top_orgaos']['total_liquidado'].sum()-n*123.45/2)<.01
                if repeat:
                    raw_times.append(wall);internal_times.append(ctx['tempo_processamento']);partitions.append(ctx['df_clean'].rdd.getNumPartitions());topn.append(len(ctx['pdf_top_orgaos']))
            finally:ctx['df_clean'].unpersist(blocking=True);spark.catalog.clearCache()
        ordered=sorted(raw_times);result['benchmarks'].append({'n':n,'warmup_runs':1,'repetitions':3,'raw_seconds':raw_times,'internal_notebook_seconds':internal_times,'median_seconds':ordered[1],'p95_nearest_rank_seconds':ordered[2],'p95_limit':'only3samples: p95 equals observed maximum; weak tail estimate','rows_per_second_from_median':n/ordered[1],'input_bytes':path.stat().st_size,'input_partitions':partitions,'shuffle_partitions_config':8,'top_pandas_rows':topn,'cache':'unpersist+clear between runs, cold Spark persisted DF; same JVM and warm OS file cache; within each run persisted DF reused for agg and ranking','correct':True});save()
finally:
    if spark:spark.stop()
    result['spark_stopped']=True;save()
    try:
        if SparkContext._gateway:SparkContext._gateway.shutdown()
    except Exception:pass
failures=[c for c in result['checks'] if not c['pass']]
print(json.dumps({'checks':len(result['checks']),'FAILs':failures,'benchmarks':len(result['benchmarks'])},ensure_ascii=False))
if failures:sys.exit(1)
