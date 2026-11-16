// Construit une page HTML autonome (JS et CSS intégrés) pour un lien de test hébergé.
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const out = process.argv[2] ?? 'dist-test-link/index.html';
execSync('npx vite build --outDir dist-test-link --emptyOutDir', { stdio: 'inherit', env: { ...process.env, VITE_TEST_LINK: '1' } });
const dir = 'dist-test-link/assets';
const files = readdirSync(dir);
const js = files.filter((f) => f.endsWith('.js')).map((f) => readFileSync(join(dir, f), 'utf8'));
const css = files.filter((f) => f.endsWith('.css')).map((f) => readFileSync(join(dir, f), 'utf8')).join('\n');
if (js.length !== 1) throw new Error(`Attendu 1 fichier JS, obtenu ${js.length} (désactiver le découpage)`);
const script = js[0].replace(/<\/script/gi, '<\\/script');
const html = `<title>Réservation Detailing</title>
<meta name="description" content="Réservation en ligne de nettoyage detailing auto et moto." />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
<style>${css}</style>
<div id="root"></div>
<script type="module">${script}</script>
`;
writeFileSync(out, html);
console.log(`Page de test : ${out} (${(html.length / 1024).toFixed(0)} Ko)`);
