import assert from 'node:assert/strict';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { Repl } from '../src/cli/Repl.js';
import { Readable, Writable } from 'node:stream';
import { TestHarness } from './support/TestHarness.js';

test('REPL processes piped lines sequentially, including async save/read, and ends at EOF', async () => {
  const h = new TestHarness(); let output = '';
  const sink = new Writable({ write(chunk, _encoding, callback) { output += chunk.toString(); callback(); } });
  await new Repl(h.router).run(Readable.from(['init\ncreate circle c 1 2 3\nsave demo.svg\ninit\nread demo.svg\nshow c\n']), sink, false);
  assert.match(output, /svg-editor 0.1/);
  assert.match(output, /read demo.svg \(1 elements\)/);
  assert.match(output, /cx=1/);
  assert.equal(h.editor.document.count, 1);
});

test('real CLI child accepts stdin, reports errors, continues and exits without configuration changes', () => {
  const processResult = spawnSync(process.execPath, ['--import', 'tsx', 'src/main.ts'], {
    cwd: process.cwd(), encoding: 'utf8', timeout: 15000,
    input: 'init\ncreate rect r 10 20 100 50 red\nmove r 30 0\nundo\nshow r\nscale r 0\ntree\n',
  });
  assert.equal(processResult.error, undefined);
  assert.equal(processResult.status, 0, processResult.stderr);
  assert.match(processResult.stdout, /rect#r moved by \(30,0\)/);
  assert.match(processResult.stdout, /undone: move r/);
  assert.match(processResult.stdout, /x=10/);
  assert.match(processResult.stdout, /error: scale factor must be positive/);
  assert.match(processResult.stdout, /svg \(800x600\)/);
});

test('script option reads UTF-8 directly and preserves Chinese across real save/read', async () => {
  const temporaryRoot = resolve('.tmp'); await mkdir(temporaryRoot, { recursive: true });
  const directory = await mkdtemp(resolve(temporaryRoot, 'svg-script-'));
  try {
    const script = resolve(directory, 'commands.txt'); const svg = resolve(directory, 'diagram.svg');
    await writeFile(script, `init\ncreate text t 1 2 "开始 处理数据"\nsave "${svg}"\nread "${svg}"\nshow t\n`, 'utf8');
    const result = spawnSync(process.execPath, ['--import', 'tsx', 'src/main.ts', '--script', script], {
      cwd: process.cwd(), encoding: 'utf8', timeout: 15000,
    });
    assert.equal(result.error, undefined); assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /text="开始 处理数据"/);
    assert.match(await readFile(svg, 'utf8'), /开始 处理数据/);
  } finally {
    assert.ok(resolve(directory).startsWith(temporaryRoot + sep));
    await rm(directory, { recursive: true, force: true });
  }
});

test('invalid script arguments or missing files fail cleanly without falling into REPL', () => {
  for (const args of [['--script', '.tmp/absent-script.txt'], ['--unknown'], ['--script']]) {
    const result = spawnSync(process.execPath, ['--import', 'tsx', 'src/main.ts', ...args], {
      cwd: process.cwd(), encoding: 'utf8', timeout: 15000,
    });
    assert.equal(result.error, undefined); assert.equal(result.status, 1);
    assert.match(result.stderr, /^error: [^\r\n]+\r?\n$/);
    assert.equal(result.stdout, '');
  }
});
