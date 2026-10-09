"""Bounded owned child only; sample Python/JVM RSS separately, not a peak claim."""
import argparse
import json
import os
from pathlib import Path
import subprocess
import sys
import time
import datetime
import psutil

p=argparse.ArgumentParser()
p.add_argument('--label',required=True)
p.add_argument('--evidence',type=Path,required=True)
p.add_argument('--timeout',type=int,default=180)
p.add_argument('command',nargs=argparse.REMAINDER)
a=p.parse_args()
lab=Path.cwd()
if 'labs/mission06/auditoria-despesas-pyspark' not in lab.as_posix():raise SystemExit('Authorized lab only')
env=os.environ.copy()
env.update(PYSPARK_PYTHON=sys.executable,PYSPARK_DRIVER_PYTHON=sys.executable,SPARK_LOCAL_IP='127.0.0.1',SPARK_USER='mission06-synthetic',MPLBACKEND='Agg',PYTHONIOENCODING='utf-8',MPLCONFIGDIR=str(lab/'matplotlib-cache'),JAVA_HOME='C:/Program Files/Eclipse Adoptium/jdk-17.0.18.8-hotspot')
command=a.command[1:] if a.command and a.command[0]=='--' else a.command
if command[0]=='PYTHON':command[0]=sys.executable
a.evidence.mkdir(parents=True,exist_ok=True)
t=time.perf_counter();start=datetime.datetime.now().astimezone().isoformat();samples=[];known={};timedout=False
with (a.evidence/(a.label+'.log')).open('w',encoding='utf8') as log:
    child=subprocess.Popen(command,cwd=lab,env=env,stdout=log,stderr=subprocess.STDOUT,creationflags=subprocess.CREATE_NO_WINDOW)
    target=psutil.Process(child.pid)
    while child.poll() is None:
        py=0;jvm=0
        try:
            processes=[target]+target.children(recursive=True)
            for proc in processes:
                try:
                    known[proc.pid]=proc.create_time();name=proc.name().lower();rss=proc.memory_info().rss
                    if 'java' in name:jvm+=rss
                    elif 'python' in name:py+=rss
                except psutil.Error:pass
        except psutil.Error:pass
        samples.append({'elapsed_seconds':time.perf_counter()-t,'python_rss_bytes':py,'jvm_rss_bytes':jvm})
        if time.perf_counter()-t>a.timeout:
            timedout=True;subprocess.run(['taskkill','/PID',str(child.pid),'/T','/F'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);break
        time.sleep(.1)
    code=child.wait(timeout=10)
# Gateway shutdown should terminate JVM. Recover only descendants recorded with
# matching creation time, never all java or unrelated user processes.
left=[]
for pid,created in known.items():
    try:
        proc=psutil.Process(pid)
        if proc.create_time()==created and proc.is_running():
            left.append(pid);proc.terminate()
            try:proc.wait(timeout=5)
            except psutil.TimeoutExpired:proc.kill()
    except psutil.Error:pass
record={'command':subprocess.list2cmdline(command),'exitcode':code,'timedout':timedout,'started_at':start,'wall_seconds':time.perf_counter()-t,'cwd':str(lab),'scope':'child Python(s) and descendant JVM(s); wrappers/OS file cache excluded; 100ms RSS samples; max observed, not absolute peak','python_max_sampled_rss_bytes':max((s['python_rss_bytes'] for s in samples),default=0),'jvm_max_sampled_rss_bytes':max((s['jvm_rss_bytes'] for s in samples),default=0),'rss_samples':samples,'owned_descendants_recovered_after_exit':left,'owned_pids':list(known)}
(a.evidence/(a.label+'-run.json')).write_text(json.dumps(record,indent=2),encoding='utf8')
print(json.dumps({k:v for k,v in record.items() if k!='rss_samples'}),flush=True)
