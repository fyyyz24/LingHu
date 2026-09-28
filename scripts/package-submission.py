"""Allowlisted archive with per-file checksums; no patient records, credentials, or pretend weights."""
from pathlib import Path
import hashlib
import json
import subprocess
import zipfile
import sys
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parent.parent
TOP = ['README.md', 'package.json', 'index.html', '.gitignore', '.gitattributes']
DIRS = ['dist', 'docs', 'datasets', 'submission', 'scripts', 'tests']
files = [ROOT / name for name in TOP]
for name in DIRS:
    files.extend(p for p in (ROOT / name).rglob('*') if p.is_file() and '__pycache__' not in p.parts)
files = sorted(files, key=lambda p: p.relative_to(ROOT).as_posix())
for p in files:
    relative = p.relative_to(ROOT)
    if p.is_symlink() or ROOT not in p.resolve().parents:
        raise SystemExit(f'Unsafe path: {relative}')
    if p.name.startswith('.env') or any(x in relative.parts for x in ['.git', '.openai', 'node_modules']):
        raise SystemExit(f'Unexpected sensitive path: {relative}')
report = json.loads((ROOT / 'submission/validation-report.json').read_text(encoding='utf-8'))
if report['status'] != 'passed':
    raise SystemExit('Run successful validation first')
for item in report['validated_files']:
    if hashlib.sha256((ROOT / item['file']).read_bytes()).hexdigest() != item['sha256']:
        raise SystemExit('Validation stale: ' + item['file'])
def git(*args):
    result = subprocess.run(['git', *args], cwd=ROOT, capture_output=True, text=True, encoding='utf-8')
    return result.stdout.strip() if result.returncode == 0 else 'unavailable'
manifest = {'format': 1, 'created_at': datetime.now(timezone.utc).isoformat(),
            'source_base_commit': git('rev-parse', 'HEAD'),
            'source_worktree_changes_at_packaging': git('status', '--porcelain'),
            'note': 'Exact package content is defined by file hashes. No model training or medical review claimed.',
            'files': [{'path': p.relative_to(ROOT).as_posix(), 'bytes': p.stat().st_size,
                       'sha256': hashlib.sha256(p.read_bytes()).hexdigest()} for p in files]}
output = ROOT / 'release/linghu-submission.zip'
output.parent.mkdir(exist_ok=True)
with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as archive:
    for p in files:
        archive.write(p, p.relative_to(ROOT).as_posix())
    archive.writestr('MANIFEST.json', json.dumps(manifest, ensure_ascii=False, indent=2))
with zipfile.ZipFile(output) as archive:
    assert archive.testzip() is None
    for item in manifest['files']:
        assert hashlib.sha256(archive.read(item['path'])).hexdigest() == item['sha256']
digest = hashlib.sha256(output.read_bytes()).hexdigest()
(output.parent / 'linghu-submission.sha256').write_text(digest + '  linghu-submission.zip\n', encoding='ascii')
print(f'Packaged and verified {len(files)} files: {output} ({output.stat().st_size} bytes)')
print('SHA-256:', digest)
