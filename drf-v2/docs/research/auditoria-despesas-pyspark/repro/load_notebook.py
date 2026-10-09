"""Load inspected cell, preserve transformations; adapt only local execution/bootstrap."""
import ast
import hashlib
import json
from pathlib import Path

def load_pipeline(lab: Path, ansi_off=False):
    notebook = json.loads((lab / 'analise.ipynb').read_text(encoding='utf8'))
    source = ''.join(notebook['cells'][2]['source'])
    tree = ast.parse(source, filename='analise.ipynb:cell2')
    removed = []
    for node in tree.body:
        if isinstance(node, ast.Expr) and isinstance(node.value, ast.Call) and isinstance(node.value.func, ast.Name) and node.value.func.id == 'garantir_dependencia':
            removed.append(node.lineno)
    # Keep line numbering for source citations; only module-level lifecycle calls.
    lines = source.splitlines(keepends=True)
    for number in removed:
        lines[number-1] = '# mission06: dependency preinstalled in isolated venv\n'
    adapted = ''.join(lines).replace('.master("local[*]")', '.master("local[2]")')
    addition = ('.config("spark.driver.host", "127.0.0.1")'
                '\n            .config("spark.driver.bindAddress", "127.0.0.1")'
                '\n            .config("spark.driver.port", "5283")'
                '\n            .config("spark.blockManager.port", "5284")'
                '\n            .config("spark.ui.enabled", "false")'
                '\n            .config("spark.local.dir", "' + (lab/'spark-local').as_posix() + '")')
    if ansi_off:
        addition += '\n            .config("spark.sql.ansi.enabled", "false")'
    adapted = adapted.replace('.config("spark.ui.showConsoleProgress", "false")', '.config("spark.ui.showConsoleProgress", "false")\n            ' + addition)
    ns = {'__name__': 'mission06_inspected_notebook', '__file__': str(lab/'pipeline-source.py')}
    exec(compile(adapted, 'analise.ipynb:cell2:local-bootstrap', 'exec'), ns)
    ns['PERMITIR_UPLOAD_MANUAL'] = False
    ns['MOSTRAR_DASHBOARD_NO_NOTEBOOK'] = False
    ns['FORCAR_DOWNLOAD'] = False
    ns['DATASET_URLS'] = []  # Every run must have a prevalidated local fixture/input.
    adaptation = {'cell': 2, 'source_sha256': hashlib.sha256(source.encode()).hexdigest(), 'adapted_sha256': hashlib.sha256(adapted.encode()).hexdigest(), 'removed_module_install_lines': removed, 'master': 'local[2]', 'driver_memory': '2g', 'bind': 'loopback', 'ports': [5283,5284], 'ui': False, 'upload': False, 'download_during_pipeline': False, 'matplotlib': 'Agg via process env', 'ansi_off': ansi_off, 'transformations': 'unchanged; original preparar_dataframe and executar_pipeline'}
    (lab/'pipeline-adapted.py').write_text(adapted,encoding='utf8')
    return ns, adaptation
