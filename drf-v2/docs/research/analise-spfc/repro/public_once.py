"""One ordinary FBref acquisition: no disguise flags, retries, accounts or fallback."""
import hashlib,json,sys,time
from pathlib import Path
from urllib.parse import urlsplit,urlunsplit
import pipeline,main
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from webdriver_manager.core.driver_cache import DriverCacheManager
lab=Path.cwd();e=Path(sys.argv[1]);assert 'labs/performance-lab/lote02/analise-spfc' in lab.as_posix()
result={'source_url':pipeline.SOURCE_URL,'acquisitions':1,'bootstrap':'lab driver cache+profile; standard headless options, no automation-disguise flags; real extract_real_data/main unchanged','driver_ready':False}
def driver():
 t=time.perf_counter();path=ChromeDriverManager(cache_manager=DriverCacheManager(root_dir=str(lab/'driver-cache'))).install();result['driver_install_seconds']=time.perf_counter()-t;result['driver_path']=path
 (lab/'driver-path.txt').write_text(path,encoding='utf8')
 options=webdriver.ChromeOptions();options.add_argument('--headless=new');options.add_argument('--user-data-dir='+str(lab/'chrome-profile'));options.add_argument('--disable-background-networking');options.add_argument('--no-first-run');options.add_argument('--no-default-browser-check');options.set_capability('goog:loggingPrefs',{'performance':'ALL'})
 d=webdriver.Chrome(service=Service(path,port=5285,log_output=str(lab/'chromedriver.log')),options=options);d.set_page_load_timeout(25);result['driver_ready']=True;result['chrome_version']=d.capabilities.get('browserVersion')
 quit_original=d.quit
 def quit_record():
  try:
   result['title']=d.title;result['final_url']=urlunsplit(urlsplit(d.current_url)._replace(query='',fragment=''));result['page_sha256']=hashlib.sha256(d.page_source.encode()).hexdigest();statuses=[]
   for entry in d.get_log('performance'):
    message=json.loads(entry['message'])['message']
    if message['method']=='Network.responseReceived' and message['params'].get('type')=='Document':
     resp=message['params']['response'];u=urlsplit(resp['url']);statuses.append({'url':urlunsplit((u.scheme,u.netloc,u.path,'','')),'status':resp['status']})
   result['document_statuses']=statuses
  finally:quit_original()
 d.quit=quit_record;return d
pipeline.create_driver=driver
try:
 code=main.main(['--no-open']);result['cli_exitcode']=code
except Exception as exc:code=1;result['bootstrap_error']=type(exc).__name__+': '+str(exc).splitlines()[0]
(e/'public-result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8');sys.exit(code)
