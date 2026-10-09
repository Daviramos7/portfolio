"""Bounded local smoke. Run only inside the sanitized mission lab, after install.
Uses the project's synthetic fixture/interception helper; no production credentials.
"""
import argparse
import json
import os
from pathlib import Path
import socket
import subprocess
import time
import urllib.request

parser = argparse.ArgumentParser()
parser.add_argument('--lab', type=Path, required=True)
parser.add_argument('--output', type=Path, required=True)
parser.add_argument('--chrome', required=True)
parser.add_argument('--water-only', action='store_true')
parser.add_argument('--console', action='store_true')
args = parser.parse_args()
lab, output = args.lab.resolve(), args.output.resolve()
if 'labs/mission06/atleta-hibrido' not in lab.as_posix():
    raise SystemExit('Only the authorized mission lab may be used')
output.mkdir(parents=True, exist_ok=True)
with socket.socket() as probe:
    probe.bind(('127.0.0.1', 5280))
(lab / '.env.local').write_text('VITE_SUPABASE_URL=http://127.0.0.1:5289\nVITE_SUPABASE_ANON_KEY=synthetic-public-key-mission06\n')
env = {k: v for k, v in os.environ.items() if not k.startswith(('VITE_', 'SUPABASE_'))}
env.update(TZ='America/Sao_Paulo', SMOKE_URL='http://127.0.0.1:5280', SMOKE_OUTPUT=str(output), PLAYWRIGHT_MODULE_PATH=str(lab / 'browser-tools/node_modules/playwright/index.mjs'), SMOKE_BROWSER_PATH=args.chrome)
script = 'scripts/smoke-polish.mjs'
if args.console:
    source = (lab / script).read_text(encoding='utf8')
    source = source.replace('const allErrors = [];', 'const allErrors = []; const consoleErrors = [];')
    source = source.replace("page.on('pageerror', (error) => allErrors.push(error.message));", "page.on('pageerror', (error) => allErrors.push(error.message)); page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });")
    source = source.replace("assert.deepEqual(allErrors, [], 'Erros JavaScript no browser');", "assert.deepEqual(allErrors, [], 'Erros JavaScript no browser'); assert.deepEqual(consoleErrors, [], 'Console errors');")
    source = source.replace('{ results, errors: allErrors }', '{ results, errors: allErrors, consoleErrors }')
    script = 'scripts/mission06-console.mjs'
    (lab / script).write_text(source, encoding='utf8')
if args.water_only:
    source = (lab / script).read_text(encoding='utf8')
    helper = source.split('try {\n  for (const [width, height]')[0]
    if len(helper) == len(source):
        raise SystemExit('Fixture helper boundary not found; inspect revision')
    scenario = '''
try {
  const { page, context, data, writes } = await setup(390, 844);
  await nav(page, 'Registrar');
  await page.locator('.simple-tabs').getByRole('button', {name:'Água',exact:true}).click();
  await page.getByRole('button', {name:'200 ml',exact:true}).click();
  await page.getByRole('heading', {name:'1.400 ml',exact:true}).waitFor();
  assert.equal(data.daily_logs[0].water_ml,1400);
  assert.equal(writes.filter(x=>x.table==='increment_daily_water').length,1);
  await capture(page,'390-water-increment');
  assert.deepEqual(allErrors,[]);
  await writeFile(join(output,'water-results.json'),JSON.stringify({results,errors:allErrors,waterMl:data.daily_logs[0].water_ml,rpcWrites:writes.filter(x=>x.table==='increment_daily_water')},null,2));
  await context.close();
} finally { await browser.close(); }
'''
    script = 'scripts/mission06-water.mjs'
    (lab / script).write_text(helper + scenario, encoding='utf8')
servercmd = ['node', 'node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5280', '--strictPort']
smokecmd = ['node', script]
record = {'server_command': subprocess.list2cmdline(servercmd), 'smoke_command': subprocess.list2cmdline(smokecmd), 'conditions': 'synthetic local env; mocked/aborted non-app requests; installed Chrome headless; reduced motion; Sao Paulo timezone'}
start = time.perf_counter()
with (output / 'startup.log').open('w', encoding='utf8') as slog:
    server = subprocess.Popen(servercmd, cwd=lab, env=env, stdout=slog, stderr=subprocess.STDOUT, creationflags=subprocess.CREATE_NO_WINDOW)
    try:
        for _ in range(100):
            try:
                with urllib.request.urlopen('http://127.0.0.1:5280', timeout=1) as response:
                    record.update(http_status=response.status, readiness_seconds=time.perf_counter()-start)
                break
            except Exception:
                if server.poll() is not None:
                    raise RuntimeError('server exited before readiness')
                time.sleep(.1)
        else:
            raise RuntimeError('readiness timeout')
        begin = time.perf_counter()
        with (output / 'browser.log').open('w', encoding='utf8') as log:
            smoke = subprocess.Popen(smokecmd, cwd=lab, env=env, stdout=log, stderr=subprocess.STDOUT, creationflags=subprocess.CREATE_NO_WINDOW)
            try:
                record['exitcode'] = smoke.wait(timeout=240)
            except subprocess.TimeoutExpired:
                subprocess.run(['taskkill','/PID',str(smoke.pid),'/T','/F'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                record['exitcode'] = 'timeout'
        record['smoke_wall_seconds'] = time.perf_counter()-begin
    finally:
        if server.poll() is None:
            subprocess.run(['taskkill','/PID',str(server.pid),'/T','/F'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        record['server_stopped'] = server.wait(timeout=10) is not None
        record['wall_seconds'] = time.perf_counter()-start
        (output / 'run.json').write_text(json.dumps(record, indent=2))
        print(json.dumps(record))
