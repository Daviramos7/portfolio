import contextlib,hashlib,io,json,math,statistics,sys,time
from pathlib import Path
from unittest.mock import patch,Mock
import numpy as np,pandas as pd
import pipeline as p,analises as a,menu
from selenium.common.exceptions import TimeoutException
import matplotlib.pyplot as plt
sys.stdout.reconfigure(encoding='utf8');lab=Path.cwd();e=Path(sys.argv[1]);assert 'labs/performance-lab/lote02/analise-spfc' in lab.as_posix()
checks=[];bench=[]
def ck(name,expected,actual,kind='contract'):checks.append({'name':name,'expected':expected,'actual':actual,'pass':expected==actual,'kind':kind})
def raw(n):
 return pd.DataFrame({'Player':['Sintético '+str(i) for i in range(n)],'Playing Time_Min':np.full(n,900),'Performance_Gls':np.arange(n)%10,'Performance_Ast':np.arange(n)%7,'Performance_CrdY':np.arange(n)%4,'Performance_CrdR':np.arange(n)%2,'Expected_xG':np.arange(n)%10+.5})
base=raw(8);multi=base.copy();multi.columns=pd.MultiIndex.from_tuples([('Unnamed: 0_level_0','Player'),('Playing Time','Min'),('Performance','Gls'),('Performance','Ast'),('Performance','CrdY'),('Performance','CrdR'),('Expected','xG')]);html=multi.to_html(index=False);(e/'fixture-table.html').write_text(html,encoding='utf8')
driver=Mock();driver.find_element.return_value.get_attribute.return_value=html
with patch.object(p,'create_driver',return_value=driver),patch.object(p.time,'sleep'):
 extracted=p.extract_real_data();ck('real extractor injected driver multiheaders',8,len(extracted));ck('driver quit',1,driver.quit.call_count)
 driver.reset_mock();driver.find_element.return_value.get_attribute.return_value=html
 result=p.run_pipeline(output_path=lab/'offline.csv');ck('offline collector pipeline result source field','real',result.source,'field means branch; fixture is synthetic, NOT real FBref evidence')
ck('offline saved output roundtrip',True,pd.read_csv(lab/'offline.csv').equals(extracted))
old=(lab/'offline.csv').read_bytes()
with patch.object(p,'create_driver',return_value=driver),patch.object(p.time,'sleep'),patch.object(p,'WebDriverWait') as wait:
 wait.return_value.until.side_effect=TimeoutException('synthetic table timeout')
 try:p.run_pipeline(output_path=lab/'offline.csv');failure=False
 except p.PipelineError as exc:failure=exc.stage=='localização da tabela'
ck('timeout contextual stage',True,failure);ck('failure preserves valid output',old,(lab/'offline.csv').read_bytes())
with patch.object(pd.DataFrame,'to_csv',side_effect=OSError('synthetic disk write error')):
 try:p.save_result(extracted,lab/'offline.csv');write_failed=False
 except p.PipelineError:write_failed=True
ck('write failure surfaced',True,write_failed);ck('write failure preserves previous',old,(lab/'offline.csv').read_bytes());ck('temp cleaned',False,(lab/'offline.csv.tmp').exists())
edge=raw(5);edge['Player']=[' André ','André','Player','Squad Total',None];norm=p.normalize_data(edge);ck('names accent stripping + keep-first dedupe',['André'],norm.Jogador.tolist())
nums=raw(4);nums['Playing Time_Min']=['1,234','1.234','NA',None];nr=p.normalize_data(nums);ck('numeric token characterization',[0.,1.234,0.,0.],nr.Minutos.tolist(),'no BR/thousands-aware contract; invalid and absent become zero')
ck('comma-thousands preserves magnitude',[1234.,1.234,0.,0.],nr.Minutos.tolist(),'edge expectation; raw DataFrame, read_html may preprocess thousands')
invalid=raw(1).drop(columns='Performance_Ast')
try:p.normalize_data(invalid);missing=False
except p.DataValidationError:missing=True
ck('missing schema rejected',True,missing)
try:p.normalize_data(raw(0));empty=False
except p.DataValidationError:empty=True
ck('empty rejected',True,empty)
with contextlib.redirect_stdout(io.StringIO()):
 f=a.analisar_finalizadores(extracted,False);g=a.analisar_garcons(extracted,False);d=a.analisar_disciplina(extracted,False)
ck('goals top rate',.7,float(f.Gols_por_90_min.iloc[0]));ck('assist top rate',.6,float(g.Ast_por_90_min.iloc[0]));ck('cards total highest',4,float(d.Total_Cartoes.iloc[0]))
responses=iter(['1','2','3','0'])
with contextlib.redirect_stdout(io.StringIO()) as menuout:menu.main(lab/'offline.csv',input_fn=lambda _:next(responses),mostrar_grafico=False)
(e/'menu-offline.log').write_text(menuout.getvalue(),encoding='utf8');ck('menu all options finishes',True,'Saindo...' in menuout.getvalue())
with contextlib.redirect_stdout(io.StringIO()),patch.object(plt,'show'):
 a.analisar_finalizadores(extracted);plt.gcf().savefig(e/'sintetico-finalizadores.png');plt.close('all')
demo_path=lab/'output/dados_spfc_demo.csv';demo=pd.read_csv(demo_path);ck('fresh CLI demo matches deterministic function',True,demo.equals(p.generate_demo_data()));(e/'SINTETICO-demo.csv').write_bytes(demo_path.read_bytes())
for n in [1000,10000,100000]:
 inp=raw(n);fixture=lab/f'fixture-{n}.csv';inp.to_csv(fixture,index=False);digest=hashlib.sha256(fixture.read_bytes()).hexdigest();out=lab/f'benchmark-{n}.csv'
 def work():
  normalized=p.normalize_data(inp)
  with contextlib.redirect_stdout(io.StringIO()):top=a.analisar_finalizadores(normalized,False)
  p.save_result(normalized,out)
  return normalized,top
 work();times=[]
 for _ in range(3):
  t=time.perf_counter();normalized,top=work();times.append(time.perf_counter()-t)
  assert len(normalized)==n and normalized.Gols.sum()==(n//10)*45 and math.isclose(top.Gols_por_90_min.iloc[0],.9)
  assert len(pd.read_csv(out))==n and not out.with_suffix('.csv.tmp').exists()
 bench.append({'n':n,'warmup':1,'repetitions':3,'samples_seconds':times,'median_seconds':statistics.median(times),'p95_nearest_rank_seconds':max(times),'rows_per_second_from_median':n/statistics.median(times),'fixture_sha256':digest,'fixture_bytes':fixture.stat().st_size,'output_sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'scope':'normalize_data + analisar_finalizadores(no chart; printed top5 formatting included) + save_result atomic CSV IO; input memory warm/OS warm; overwrite same lab output; post-timing readback/asserts excluded; serial1'})
# Byte equality checks represented safely without embedding CSV payloads.
for c in checks:
 for key in ['expected','actual']:
  if isinstance(c[key],bytes):c[key]={'sha256':hashlib.sha256(c[key]).hexdigest(),'bytes':len(c[key])}
r={'checks':checks,'benchmarks':bench,'fixture':'deterministic sequence no RNG; CLI demo seed42 from source','network':'driver/HTML injected offline; no remote request; source field real is branch only','comment_tables':'not implemented by DOM selector; no comment unwrapping added; not claimed tested end-to-end','demo_label':'SINTETICO-demo.csv evidence filename; runtime demo path and CLI label explicitly synthetic'}
(e/'offline-results.json').write_text(json.dumps(r,ensure_ascii=False,indent=2),encoding='utf8');fails=[c for c in checks if not c['pass']];print(json.dumps({'checks':len(checks),'FAILs':fails,'benchmarks':bench},ensure_ascii=False));sys.exit(1 if fails else 0)
