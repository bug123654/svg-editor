import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { SvgCodec } from '../src/io/SvgCodec.js';
import { TestHarness } from './support/TestHarness.js';

test('requirement section 6: entire transcript, only two intentional failures, saved state retained', async () => {
  const h = new TestHarness();
  h.storage.setSource('examples/other.svg', await readFile('examples/other.svg', 'utf8'));
  const lines = (await readFile('examples/session.commands', 'utf8')).split(/\r?\n/);
  const errors: string[] = [];
  for (const line of lines) {
    const output = await h.router.execute(line);
    if (output.startsWith('error:')) errors.push(output);
  }
  assert.deepEqual(errors, [
    'error: cannot group a container into its own descendant: markers',
    'error: undo not allowed after io command',
  ]);
  const saved = (await h.storage.read('examples/demo.svg')).document;
  assert.equal(saved.count, 5);
  assert.equal(saved.require('c1').attributes.cx, '130');
  assert.equal(saved.require('title').textContent, 'My Diagram');
  assert.equal(saved.require('box').parent!.id, 'markers');
  assert.equal(h.editor.document.count, 7);
  assert.equal(h.editor.document.size, '400x300');
  assert.match(h.editor.tree(), /rect#rect1/);
});

test('requirement section 6.1: UTF-8 flowchart, subtree moves with label, final SVG roundtrip', async () => {
  const h = new TestHarness();
  const lines = (await readFile('examples/flowchart.commands', 'utf8')).split(/\r?\n/);
  const errors: string[] = [];
  for (const line of lines) {
    const before = line === 'move node2 0 100' ? h.snapshot() : undefined;
    const output = await h.router.execute(line);
    if (output.startsWith('error:')) errors.push(output);
    if (before !== undefined) {
      assert.equal(h.editor.document.require('process').attributes.y, '200');
      assert.equal(h.editor.document.require('process-label').attributes.y, '235');
    }
  }
  assert.deepEqual(errors, ['error: undo not allowed after io command']);
  const saved = (await h.storage.read('examples/flowchart.svg')).document;
  assert.equal(saved.require('process').attributes.y, '100');
  assert.equal(saved.require('process-label').textContent, '处理数据 v2');
  assert.equal(saved.require('start-label').textContent, '开始');
  assert.equal(saved.count, 8); // Three groups + two rectangles + two texts + one line; excludes the SVG root.
  assert.deepEqual(saved.root.children.map(s => s.id), ['flowchart']);
  const codec = new SvgCodec(); const xml = codec.encode(saved);
  assert.equal(codec.encode(codec.decode(xml).document), xml);
});
