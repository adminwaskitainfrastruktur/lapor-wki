// Menyusun folder "deploy/" yang siap di-upload ke subdomain (Hostinger File Manager / FTP).
// Pakai: node scripts/assemble.mjs [--no-build]
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const web = join(root, 'web');
const server = join(root, 'server');
const out = join(root, 'deploy');

if (!process.argv.includes('--no-build')) {
  const r = spawnSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build'], { cwd: web, stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
if (!existsSync(join(web, 'dist'))) {
  console.error('web/dist tidak ada. Jalankan build dulu.');
  process.exit(1);
}

// Simpan config.php dan isi storage yang sudah ada di deploy/ (agar tidak hilang saat disusun ulang)
const keep = ['app/config.php'];
const saved = new Map();
for (const k of keep) {
  const p = join(out, k);
  if (existsSync(p)) saved.set(k, p);
}
const tmp = join(root, '.deploy-keep');
rmSync(tmp, { recursive: true, force: true });
mkdirSync(tmp, { recursive: true });
for (const [k, p] of saved) {
  mkdirSync(dirname(join(tmp, k)), { recursive: true });
  cpSync(p, join(tmp, k));
}

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync(server, out, {
  recursive: true,
  filter: (src) => {
    const rel = src.slice(server.length).replaceAll('\\', '/');
    if (rel === '/app/config.php') return false;
    if (rel.startsWith('/storage/uploads/') && statSync(src).isFile()) return false;
    return true;
  },
});
cpSync(join(web, 'dist'), out, { recursive: true });
mkdirSync(join(out, 'storage', 'uploads'), { recursive: true });

for (const [k] of saved) cpSync(join(tmp, k), join(out, k));
rmSync(tmp, { recursive: true, force: true });

writeFileSync(join(out, 'DEPLOY.txt'), `Upload seluruh isi folder ini ke folder subdomain di Hostinger.\nBuat app/config.php dari app/config.sample.php.\nJangan upload config.php ke tempat lain.\n`);
const files = readdirSync(out);
console.log('deploy/ siap:', files.join(', '));
