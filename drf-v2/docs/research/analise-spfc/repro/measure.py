import datetime,json,os,subprocess,sys,time
from pathlib import Path
import psutil
sys.stdout.reconfigure(encoding='utf8')
lab=Path.cwd();assert 'labs/performance-lab/lote02/analise-spfc' in lab.as_posix()
label=sys.argv[1];e=Path(sys.argv[2]);command=[sys.executable]+sys.argv[3:];e.mkdir(parents=True,exist_ok=True)
(lab/'temp').mkdir(exist_ok=True)
env=os.environ.copy();env.update(PYTHONIOENCODING='utf8',MPLBACKEND='Agg',MPLCONFIGDIR=str(lab/'mpl-cache'),TMP=str(lab/'temp'),TEMP=str(lab/'temp'),WDM_LOG='0')
start=datetime.datetime.now().astimezone().isoformat();t=time.perf_counter();samples=[];owned={};timeout=False
with (e/f'{label}.log').open('w',encoding='utf8') as f:
 p=subprocess.Popen(command,stdout=f,stderr=subprocess.STDOUT,env=env,creationflags=subprocess.CREATE_NO_WINDOW)
 while p.poll() is None:
  entries=[]
  try:
   proc=psutil.Process(p.pid)
   for q in [proc]+proc.children(recursive=True):
    try:owned[q.pid]=q.create_time();entries.append({'pid':q.pid,'name':q.name(),'rss':q.memory_info().rss})
    except psutil.Error:pass
  except psutil.Error:pass
  samples.append({'seconds':time.perf_counter()-t,'processes':entries})
  if time.perf_counter()-t>90:timeout=True;break
  time.sleep(.1)
 cleanup=[]
 for pid,created in reversed(list(owned.items())):
  try:
   q=psutil.Process(pid)
   if q.create_time()==created and (timeout or pid!=p.pid):q.terminate();cleanup.append(pid)
  except psutil.Error:pass
 if timeout:
  try:p.wait(timeout=5)
  except subprocess.TimeoutExpired:p.kill()
 code=p.wait()
r={'command':command,'cwd':str(lab),'started_at':start,'exitcode':code,'timedout':timeout,'wall_seconds':time.perf_counter()-t,'rss_samples':samples,'rss_scope':'100ms sampled child Python and descendants; max observed not guaranteed peak; wrapper excluded','cleanup_owned_pids':cleanup}
(e/f'{label}-run.json').write_text(json.dumps(r,indent=2),encoding='utf8');print(json.dumps({k:v for k,v in r.items() if k!='rss_samples'}))
