'use strict';

const fs = require('fs');
const path = require('path');

const candidates = [
  path.join(__dirname, '..', 'node_modules', 'node-pty', 'prebuilds', 'darwin-arm64', 'spawn-helper'),
  path.join(__dirname, '..', 'node_modules', 'node-pty', 'prebuilds', 'darwin-x64', 'spawn-helper'),
];

let changed = 0;
for (const file of candidates) {
  if (!fs.existsSync(file)) continue;
  const stat = fs.statSync(file);
  const mode = stat.mode | 0o755;
  if (mode === stat.mode) continue;
  fs.chmodSync(file, mode);
  changed += 1;
  console.log(`[fanbox] chmod +x ${path.relative(process.cwd(), file)}`);
}

if (!changed) console.log('[fanbox] node-pty spawn-helper permissions ok');
