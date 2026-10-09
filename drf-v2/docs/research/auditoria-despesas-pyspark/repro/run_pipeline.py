import argparse
import json
import time
import sys
from pathlib import Path
from load_notebook import load_pipeline

p=argparse.ArgumentParser()
p.add_argument('--input',type=Path,required=True)
p.add_argument('--output',type=Path,required=True)
p.add_argument('--ansi-off',action='store_true')
a=p.parse_args()
sys.stdout.reconfigure(encoding='utf8')
lab=Path.cwd()
if 'labs/mission06/auditoria-despesas-pyspark' not in lab.as_posix():
    raise SystemExit('Use authorized lab only')
ns, adaptation=load_pipeline(lab,a.ansi_off)
ns['ARQUIVO_LOCAL']=a.input.resolve();ns['PASTA_SAIDA']=a.output.resolve()
assert ns['validar_csv_local'](ns['ARQUIVO_LOCAL']), 'local CSV rejected; no remote fallback permitted'
from pyspark.sql import SparkSession
from pyspark import SparkContext
original=SparkSession.Builder.getOrCreate
startup=[]
def measured(builder):
    t=time.perf_counter();r=original(builder);startup.append(time.perf_counter()-t);return r
SparkSession.Builder.getOrCreate=measured
t=time.perf_counter();record={'adaptation':adaptation,'input':str(a.input),'output':str(a.output)}
try:
    ns['executar_pipeline']();record['exitcode']=0
except Exception as error:
    record.update(exitcode=1,error_type=type(error).__name__,error=str(error)[:3000]);raise
finally:
    record.update(wall_seconds=time.perf_counter()-t,spark_startup_seconds=startup)
    (lab/'pipeline-run.json').write_text(json.dumps(record,indent=2),encoding='utf8')
    try:
        if SparkContext._gateway: SparkContext._gateway.shutdown()
    except Exception: pass
