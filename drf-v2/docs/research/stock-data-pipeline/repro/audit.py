"""Real source functions and Streamlit AppTest; synthetic supplier only, deny external sockets."""
import ast,datetime,hashlib,json,math,os,socket,statistics,sys,threading,time
from pathlib import Path
from unittest.mock import patch

sys.stdout.reconfigure(encoding='utf8')
lab=Path.cwd()
assert 'labs/performance-lab/lote02/stock-data-pipeline' in lab.as_posix()
e=Path(sys.argv[1]).resolve();e.mkdir(parents=True,exist_ok=True)
os.environ['STREAMLIT_BROWSER_GATHER_USAGE_STATS']='false'
os.environ['PYTHONIOENCODING']='utf8'
started=datetime.datetime.now().astimezone().isoformat();begin=time.perf_counter()
orig_connect=socket.socket.connect;blocked=[]
def guard(sock,address):
    host=address[0] if isinstance(address,tuple) else ''
    if host not in ['127.0.0.1','::1','localhost']:
        blocked.append(str(address));raise RuntimeError('External network denied by lab')
    return orig_connect(sock,address)
socket.socket.connect=guard
import pandas as pd
import numpy as np
import psutil
import yfinance as yf
import streamlit as st
from streamlit.testing.v1 import AppTest

samples=[];stop=threading.Event()
def sampler():
    p=psutil.Process()
    while not stop.is_set():
        children=[]
        for c in p.children(recursive=True):
            try:children.append({'pid':c.pid,'name':c.name(),'rss':c.memory_info().rss})
            except psutil.Error:pass
        samples.append({'seconds':time.perf_counter()-begin,'python_rss':p.memory_info().rss,'children':children});stop.wait(.1)
thread=threading.Thread(target=sampler,daemon=True);thread.start()
source=(lab/'dashboard.py').read_text(encoding='utf8');tree=ast.parse(source)
nodes=[n for n in tree.body if isinstance(n,(ast.Import,ast.ImportFrom,ast.FunctionDef))]
ns={};exec(compile(ast.Module(body=nodes,type_ignores=[]),str(lab/'dashboard.py'),'exec'),ns)
checks=[];bench=[];app=[];calls=[]
def record(name,expected,actual,kind='functional'):
    checks.append({'name':name,'expected':expected,'actual':actual,'pass':expected==actual,'kind':kind})
def fixture(n,flat=False,multi=False):
    close=np.full(n,100.) if flat else 100+np.arange(n,dtype=float)*.01
    frame=pd.DataFrame({'Open':close-.02,'High':close+.03,'Low':close-.04,'Close':close,'Volume':np.arange(n)+100},index=pd.date_range('2025-01-01',periods=n,freq='min',name='Date',tz='UTC'))
    if multi:frame.columns=pd.MultiIndex.from_tuples([(c,'SYNTH') for c in frame.columns])
    return frame
def supplier(n=60,mode='normal',multi=False):
    def download(*args,**kwargs):
        calls.append({'args':list(map(str,args)),'kwargs':{k:str(v) for k,v in kwargs.items()}})
        if mode=='timeout':raise TimeoutError('synthetic supplier timeout')
        if mode=='empty':return pd.DataFrame()
        f=fixture(n,multi=multi)
        if mode=='missing':f=f.drop(columns='Close')
        return f
    return download

try:
    load=ns['carregar_dados_api'];calc=ns['processar_indicadores'];chart=ns['criar_grafico_avancado'];start=datetime.date(2025,1,1);end=datetime.date(2025,1,2)
    load.clear()
    with patch.object(yf,'download',supplier(multi=True)):
        t=time.perf_counter();raw,downloadtime=load('SYNTH',start,end);cold=time.perf_counter()-t
        t=time.perf_counter();cached,cachedtime=load('SYNTH',start,end);hot=time.perf_counter()-t
    record('normalized OHLCV schema',['data','abertura','maxima','minima','fechamento','volume'],list(raw.columns))
    record('inclusive requested end','2025-01-03',calls[0]['kwargs']['end'])
    record('cache repeated key supplier calls',1,len(calls))
    record('cache retains original download timing',downloadtime,cachedtime,'characterization: timing is cached not current request latency')
    result,internal=calc(raw);record('SMA20 independent reference',True,math.isclose(result.SMA_20.iloc[-1],float(np.mean(raw.fechamento.iloc[-20:]))))
    record('rising series RSI',100.,float(result.RSI.iloc[-1]))
    fig=chart(result,'SYNTH');(e/'synthetic-chart.json').write_text(fig.to_json(),encoding='utf8');record('chart traces',5,len(fig.data))
    dup=pd.concat([raw,raw.iloc[[-1]]],ignore_index=True);record('duplicates retained',61,len(calc(dup)[0]),'characterization; no dedupe contract')
    flatraw=fixture(60,flat=True).reset_index().rename(columns={'Date':'data','Open':'abertura','High':'maxima','Low':'minima','Close':'fechamento','Volume':'volume'})
    flatresult,_=calc(flatraw);record('flat series RSI defined',True,bool(np.isfinite(flatresult.RSI.iloc[-1])),'edge expectation; 0/0 NaN, policy requires owner')
    for n,mode in [(60,'normal'),(1,'normal'),(5,'normal'),(0,'empty'),(60,'timeout'),(60,'missing')]:
        st.cache_data.clear();t=time.perf_counter()
        with patch.object(yf,'download',supplier(n,mode)):
            at=AppTest.from_file(str(lab/'dashboard.py'),default_timeout=20).run()
        errors=[x.message for x in at.exception];metrics=[{'label':x.label,'value':x.value} for x in at.metric]
        item={'rows':n,'mode':mode,'wall_seconds':time.perf_counter()-t,'exceptions':errors,'metrics':metrics,'errors':[x.value for x in at.error]};app.append(item)
        expected=0
        record(f'app rows={n} mode={mode} no uncaught exception',expected,len(errors),'app real with injected supplier')
        if n==5 and mode=='normal':record('short history trend unavailable',True,any(x['value']=='Indisponível' for x in metrics),'edge expectation; SMA20 has insufficient rows')
    st.cache_data.clear()
    with patch.object(yf,'download',supplier()):
        at=AppTest.from_file(str(lab/'dashboard.py'),default_timeout=20).run();at.selectbox[0].select('AAPL').run()
    usd=[x.value for x in at.metric if x.label=='Preço Atual'];record('USD ticker not labelled BRL',False,bool(usd and usd[0].startswith('R$')),'currency presentation expectation')
    for n in [1000,10000,100000]:
        f=fixture(n).reset_index().rename(columns={'Date':'data','Open':'abertura','High':'maxima','Low':'minima','Close':'fechamento','Volume':'volume'})
        path=lab/f'fixture-{n}.csv';f.to_csv(path,index=False);digest=hashlib.sha256(path.read_bytes()).hexdigest()
        calc(f);times=[];itimes=[]
        for _ in range(5):
            t=time.perf_counter();r,it=calc(f);times.append(time.perf_counter()-t);itimes.append(it)
            assert len(r)==n and math.isclose(r.SMA_20.iloc[-1],float(f.fechamento.iloc[-20:].mean()),rel_tol=1e-10) and float(r.RSI.iloc[-1])==100
            assert 'SMA_20' not in f.columns
        med=statistics.median(times);bench.append({'n':n,'warmup':1,'repetitions':5,'samples_seconds':times,'internal_time_time_samples':itimes,'median_seconds':med,'p95_nearest_rank_seconds':max(times),'rows_per_second_from_median':n/med,'fixture_sha256':digest,'fixture_bytes':path.stat().st_size,'assertions':'row count, SMA20 independent mean, rising RSI100, input not modified','scope':'real processar_indicadores; copy+rolling calculations; in-memory warm input; no extraction IO/cache/chart/UI; serial concurrency1'})
    payload={'started_at':started,'wall_seconds':time.perf_counter()-begin,'source_sha256':hashlib.sha256(source.encode()).hexdigest(),'versions':{'python':sys.version,'pandas':pd.__version__,'numpy':np.__version__,'streamlit':st.__version__,'yfinance':yf.__version__},'fixture':'deterministic arithmetic sequence; no RNG; minute timestamp only synthetic benchmark, not daily market data','checks':checks,'apps':app,'benchmarks':bench,'cache_single_probe':{'cold_seconds':cold,'hot_seconds':hot,'returned_download_seconds':downloadtime,'scope':'mock yf.download; actual Streamlit cache; n1 each; no remote integration speed claim'},'network':{'adapter':'yf.download patched in process; yfinance remote protocol not tested','external_socket_attempts_blocked':blocked},'rss_scope':'100ms samples Python process includes imports/AppTest/checks/benchmarks; not peak or per-cardinality; children separately enumerated','python_max_sampled_rss_bytes':max(x['python_rss'] for x in samples),'rss_samples':samples,'existing_suite_lint_build':'N/A absent','test_kind':'complementary harness, not original suite'}
    (e/'results.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2,default=str),encoding='utf8')
    fails=[x for x in checks if not x['pass']];print(json.dumps({'checks':len(checks),'FAILs':fails,'benchmarks':bench},ensure_ascii=False));exitcode=1 if fails else 0
finally:
    stop.set();thread.join();socket.socket.connect=orig_connect
sys.exit(exitcode)
