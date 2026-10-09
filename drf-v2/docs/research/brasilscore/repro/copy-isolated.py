import argparse
from pathlib import Path, PurePosixPath
import subprocess

p = argparse.ArgumentParser()
p.add_argument('--source', type=Path, required=True)
p.add_argument('--lab', type=Path, required=True)
a = p.parse_args()
source, lab = a.source.resolve(), a.lab.resolve()
sha = 'aadc1e996de265e1e053a1c25567ecdb6bf7bc71'
if lab.exists() or 'labs/mission06/brasilscore' not in lab.as_posix():
    raise SystemExit('Use a NEW authorized BrasilScore lab directory')
if subprocess.check_output(['git','rev-parse','HEAD'],cwd=source,text=True).strip()!=sha or subprocess.check_output(['git','status','--porcelain'],cwd=source,text=True).strip():
    raise SystemExit('Source must be clean at audited SHA')
lab.mkdir(parents=True)
for name in subprocess.check_output(['git','ls-files'],cwd=source,text=True).splitlines():
    if '.env' in PurePosixPath(name).name or name.startswith('.github/'):
        continue
    if name.startswith(('assets/','server/','tests/','docs/')) or name in ['package.json','package-lock.json','vite.config.js','.hintrc','README.md'] or name.endswith('.html'):
        dest=lab/name;dest.parent.mkdir(parents=True,exist_ok=True)
        dest.write_bytes(subprocess.check_output(['git','show','HEAD:'+name],cwd=source))
print('Safe tracked copy created at',lab)
