"""Copy a whitelist of tracked source at the audited SHA, never environment/data files."""
import argparse
from pathlib import Path, PurePosixPath
import subprocess

p = argparse.ArgumentParser()
p.add_argument('--source', type=Path, required=True)
p.add_argument('--lab', type=Path, required=True)
a = p.parse_args()
source, lab = a.source.resolve(), a.lab.resolve()
revision = '0ae9190b15b9da943c3c640eddd9fd5e9ecf0b84'
if 'labs/mission06/atleta-hibrido' not in lab.as_posix() or lab.exists():
    raise SystemExit('Use a NEW directory inside the authorized mission lab')
if subprocess.check_output(['git','rev-parse','HEAD'], cwd=source, text=True).strip() != revision:
    raise SystemExit('Source revision differs; audit must be refreshed')
if subprocess.check_output(['git','status','--porcelain'], cwd=source, text=True).strip():
    raise SystemExit('Source is dirty; do not overwrite or assume the audit matches it')
names = subprocess.check_output(['git','ls-tree','-r','--name-only',revision], cwd=source, text=True).splitlines()
lab.mkdir(parents=True)
for name in names:
    path = PurePosixPath(name)
    allowed = name.startswith(('src/','database/','scripts/','public/branding/','logos/','prompts/','android_bridge/')) or name in ['package.json','pnpm-lock.yaml','pnpm-workspace.yaml','index.html','vite.config.js','eslint.config.js','tsconfig.json','README.md','SECURITY.md']
    if not allowed or '.env' in path.name or 'gradle.properties' in name or path.suffix in ['.jar','.keystore','.jks']:
        continue
    if any(part in ['node_modules','.git','build','.gradle'] for part in path.parts):
        continue
    target = lab / name
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(subprocess.check_output(['git','show',revision+':'+name],cwd=source))
print('Copied safe tracked source at', revision, 'to', lab)
