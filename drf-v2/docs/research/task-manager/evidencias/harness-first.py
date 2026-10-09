"""Bounded real HTTP handler + disposable real SQLite, synthetic tasks only."""
import contextlib,datetime,hashlib,http.client,io,json,math,sqlite3,statistics,sys,threading,time
from pathlib import Path
from unittest.mock import patch
import psutil
import backend_server as b,cli_client as cli
sys.stdout.reconfigure(encoding='utf8');lab=Path.cwd();assert 'labs/night-shift-audit/task-manager' in lab.as_posix();e=Path(sys.argv[1]);e.mkdir(parents=True,exist_ok=True)
db=lab/'synthetic-tasks.db';b.DATABASE_NAME=str(db)
with sqlite3.connect(db) as c:c.executescript((lab/'database_setup.sql').read_text());c.execute('DELETE FROM tarefas');c.execute("DELETE FROM sqlite_sequence WHERE name='tarefas'")
server=b.HTTPServer(('127.0.0.1',5287),b.TaskApiHandler);thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start();cli.BASE_URL='http://127.0.0.1:5287';checks=[];bench=[];samples=[];stop=threading.Event();start=time.perf_counter()
def sample():
 p=psutil.Process()
 while not stop.is_set():samples.append({'seconds':time.perf_counter()-start,'rss_python_bytes':p.memory_info().rss});stop.wait(.1)
monitor=threading.Thread(target=sample,daemon=True);monitor.start()
def req(method,path,payload=None,raw=None):
 c=http.client.HTTPConnection('127.0.0.1',5287,timeout=3);body=raw if raw is not None else json.dumps(payload) if payload is not None else None
 try:
  c.request(method,path,body=body,headers={'Content-Type':'application/json'});r=c.getresponse();data=r.read();return r.status,json.loads(data),len(data)
 except Exception as ex:return 0,{'instrumentation_observed_transport_error':type(ex).__name__},0
 finally:c.close()
def ck(name,expected,actual,kind='contract'):checks.append({'name':name,'expected':expected,'actual':actual,'pass':expected==actual,'kind':kind})
try:
 ck('startup empty listing',[],req('GET','/tasks')[1])
 status,task,_=req('POST','/tasks',{'titulo':'Sintético Árvore','descricao':'Fixture local'});ck('create status',201,status);ck('default status','pendente',task['status']);tid=task['id'];ck('get persisted task title','Sintético Árvore',req('GET',f'/tasks/{tid}')[1]['titulo'])
 with sqlite3.connect(db) as c:ck('SQLite real persisted row',1,c.execute('SELECT COUNT(*) FROM tarefas WHERE id=?',(tid,)).fetchone()[0])
 ck('missing ID',404,req('GET','/tasks/999999')[0]);ck('invalid ID',400,req('GET','/tasks/not-an-id')[0]);ck('missing title rejected',400,req('POST','/tasks',{'descricao':'x'})[0]);ck('invalid JSON rejected',400,req('POST','/tasks',raw='{')[0])
 ck('update documented CRUD',200,req('PUT',f'/tasks/{tid}',{'status':'completo'})[0],'README expectation; method stub')
 ck('delete documented CRUD',204,req('DELETE',f'/tasks/{tid}')[0],'README expectation; method stub')
 ck('empty title rejected',400,req('POST','/tasks',{'titulo':''})[0],'validation expectation; API checks presence only')
 ck('null title controlled rejection',400,req('POST','/tasks',{'titulo':None})[0],'validation expectation; SQL exception closes request')
 ck('query on item route',200,req('GET',f'/tasks/{tid}?probe=1')[0],'routing expectation; ID parsed from raw self.path')
 first=req('POST','/tasks',{'titulo':'Reexecução sintética'})[1];second=req('POST','/tasks',{'titulo':'Reexecução sintética'})[1];ck('POST non-idempotent characterization',True,first['id']!=second['id'],'not bug; no idempotency contract')
 cliout=io.StringIO()
 with contextlib.redirect_stdout(cliout),patch('builtins.input',side_effect=['2','CLI sintético','Descrição CLI','3',str(tid),'4',str(tid),'','','completo','5',str(tid),'6']):cli.main()
 (e/'cli-flow.log').write_text(cliout.getvalue(),encoding='utf8');ck('CLI creates and reports unsupported CRUD',True,'Tarefa adicionada com sucesso' in cliout.getvalue() and '501' in cliout.getvalue())
 for n in [1000,10000,100000]:
  with sqlite3.connect(db) as c:
   c.execute('DELETE FROM tarefas');c.execute("DELETE FROM sqlite_sequence WHERE name='tarefas'");c.executemany("INSERT INTO tarefas(titulo,descricao,criado_em) VALUES(?,?,?)",((f'Sintético {i}','fixture','2026-01-01 00:00:00') for i in range(n)))
  status,rows,size=req('GET','/tasks');assert status==200 and len(rows)==n
  times=[];sizes=[]
  for _ in range(3):
   t=time.perf_counter();status,rows,size=req('GET','/tasks');times.append(time.perf_counter()-t);sizes.append(size)
   assert status==200 and len(rows)==n and rows[0]['titulo']=='Sintético 0' and rows[-1]['titulo']==f'Sintético {n-1}' and sum(x['id'] for x in rows)==n*(n+1)//2
  med=statistics.median(times);bench.append({'n':n,'warmup':1,'repetitions':3,'samples_seconds':times,'median_seconds':med,'p95_nearest_rank_seconds':max(times),'rows_per_second_from_median':n/med,'response_bytes':sizes,'scope':'GET/tasks real HTTPServer+new SQLite connection+fetchall+JSON serialization+loopback transfer+client JSON decode; serial concurrency1; OS cache warm, no DB write/preparation; actual handler logging retained in redirected log','fixture':'deterministic title i, ids1..n, fixed synthetic timestamp','fixture_rows_sha256':hashlib.sha256(json.dumps(rows,ensure_ascii=False,sort_keys=True).encode()).hexdigest()})
 r={'checks':checks,'benchmarks':bench,'versions':{'python':sys.version,'sqlite':sqlite3.sqlite_version,'requests':cli.requests.__version__,'psutil':psutil.__version__},'conditions':'real source handler/CLI unchanged; only DB path and CLI BASE_URL globals injected; loopback bind replaces original all-interface startup; synthetic SQLite created from tracked schema; no original DB/binary used','rss_scope':'100ms snapshots one combined Python/server/client process, max observed not peak','rss_samples':samples,'max_sampled_rss_bytes':max(s['rss_python_bytes'] for s in samples),'suite_lint_build':'N/A absent'}
 (e/'results.json').write_text(json.dumps(r,ensure_ascii=False,indent=2),encoding='utf8');fails=[x for x in checks if not x['pass']];print(json.dumps({'checks':len(checks),'FAILs':fails,'benchmarks':bench},ensure_ascii=False));code=1 if fails else 0
finally:
 server.shutdown();server.server_close();thread.join();stop.set();monitor.join()
sys.exit(code)
