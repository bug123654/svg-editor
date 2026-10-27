import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdir, mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { FileSvgStorage } from '../src/io/FileSvgStorage.js';
import { Editor } from '../src/application/Editor.js';
import { CommandRouter } from '../src/cli/CommandRouter.js';

test('real file save/read, overwrite, path reuse, failure rollback and temporary-file cleanup', async () => {
  const temporaryRoot = resolve('.tmp');
  await mkdir(temporaryRoot, { recursive: true });
  const directory = await mkdtemp(resolve(temporaryRoot, 'svg-files-'));
  try {
    const editor = new Editor(new FileSvgStorage(directory)); const router = new CommandRouter(editor);
    assert.equal(await router.execute('init 400 200'), 'canvas 400x200 created');
    await router.execute('create text t 1 2 "文件测试 & <文字>"');
    assert.equal(await router.execute('save "with spaces.svg"'), 'saved to with spaces.svg (1 elements)');
    await router.execute('set t text "updated"');
    assert.equal(await router.execute('save'), 'saved to with spaces.svg (1 elements)');
    assert.match(await readFile(resolve(directory, 'with spaces.svg'), 'utf8'), /updated/);
    await router.execute('init');
    assert.equal(await router.execute('read "with spaces.svg"'), 'read with spaces.svg (1 elements)');
    assert.equal(editor.document.require('t').textContent, 'updated');
    await router.execute('move t 1 0');
    assert.equal(await router.execute('save missing/path.svg'), 'error: cannot write file: missing/path.svg');
    assert.equal(await router.execute('read missing.svg'), 'error: cannot read file: missing.svg');
    assert.equal(await router.execute('save .'), 'error: cannot write file: .');
    assert.ok(!(await router.execute('undo')).startsWith('error:'));
    assert.deepEqual(await readdir(directory), ['with spaces.svg']);
  } finally {
    assert.ok(resolve(directory).startsWith(temporaryRoot + sep));
    await rm(directory, { recursive: true, force: true });
  }
});
