'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const appPath = path.resolve(process.argv[2] || 'dist/mac-arm64/FanBox.app');
const exe = path.join(appPath, 'Contents', 'MacOS', 'FanBox');
const asar = path.join(appPath, 'Contents', 'Resources', 'app.asar');
const nodePty = path.join(asar, 'node_modules', 'node-pty');

function fail(msg) {
  console.error('[fanbox] ' + msg);
  process.exit(1);
}

if (!fs.existsSync(appPath)) fail('missing app bundle: ' + appPath);
if (!fs.existsSync(exe)) fail('missing app executable: ' + exe);
if (!fs.existsSync(asar)) fail('missing app.asar: ' + asar);

const probe = `
const pty = require(${JSON.stringify(nodePty)});
let p;
try {
  p = pty.spawn('/bin/zsh', ['-l'], {
    name: 'xterm-256color',
    cols: 80,
    rows: 24,
    cwd: process.env.HOME,
    env: { ...process.env, TERM: 'xterm-256color' },
  });
} catch (err) {
  console.error(err && err.stack || err);
  process.exit(2);
}
const timer = setTimeout(() => {
  console.error('timeout waiting for packaged terminal');
  try { p.kill(); } catch (_) {}
  process.exit(3);
}, 5000);
p.onExit(({ exitCode }) => {
  clearTimeout(timer);
  console.log('dist terminal spawned via node-pty; exit=' + exitCode);
  process.exit(exitCode === 0 ? 0 : 4);
});
setTimeout(() => p.write('echo FANBOX_DIST_TERM_OK\\r'), 120);
setTimeout(() => p.write('exit\\r'), 700);
`;

const res = spawnSync(exe, ['-e', probe], {
  env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
  stdio: 'inherit',
  timeout: 8000,
});

if (res.error) fail(res.error.message);
if (res.signal) fail('probe killed by signal ' + res.signal);
process.exit(res.status === 0 ? 0 : (res.status || 1));
