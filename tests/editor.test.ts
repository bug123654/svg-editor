import assert from 'node:assert/strict';
import test from 'node:test';
import { TestHarness } from './support/TestHarness.js';

test('no document error and help available before init', async () => {
  const h = new TestHarness();
  for (const line of ['tree', 'show r', 'move r 1 2', 'create rect r 0 0 2 3', 'canvas', 'save', 'undo', 'redo']) {
    assert.equal(await h.router.execute(line), "error: no document. use 'init' or 'read' first");
  }
  assert.match(await h.ok('help'), /addto <gid> <id>/);
});

test('create all six types, explicit parent, attributes and default appearance', async () => {
  const h = new TestHarness();
  await h.ok('init', 'create g scene', 'create rect r -1.5 2 30 40 #eee in scene',
    'create circle c 1 2 3', 'create ellipse e 4 5 6 7 red', 'create line l 0 1 2 3 black',
    'create text t 1 2 "你好 world"');
  assert.equal(h.editor.document.count, 6);
  assert.equal(h.editor.document.require('r').parent!.id, 'scene');
  assert.equal(h.editor.document.require('c').attributes.fill, undefined);
  assert.equal(h.editor.document.require('l').attributes.stroke, 'black');
  assert.match(await h.ok('show t'), /text="你好 world"/);
  assert.match(await h.ok('tree'), /rect#r.*x=-1.5.*height=40.*fill=#eee/);
  assert.ok(!(await h.ok('tree scene')).includes('circle#c'));
});

test('Composite move/scale changes descendants once and all geometry', async () => {
  const h = new TestHarness();
  await h.ok('init', 'create g outer', 'create g inner in outer',
    'create rect r 10 20 100 50 in inner', 'create line l 1 2 3 4 in outer',
    'create text t 2 3 "text" in inner', 'move outer 5 -2', 'scale outer 2');
  assert.deepEqual(h.editor.document.require('r').attributes, { id: 'r', x: '30', y: '36', width: '200', height: '100' });
  assert.deepEqual(h.editor.document.require('l').attributes, { id: 'l', x1: '12', y1: '0', x2: '16', y2: '4' });
  assert.equal(h.editor.document.require('t').attributes.x, '14');
  await h.ok('undo', 'undo');
  assert.equal(h.editor.document.require('r').attributes.x, '10');
  await h.ok('redo', 'redo');
  assert.equal(h.editor.document.require('r').attributes.x, '30');
});

test('group is one undo unit and respects original sibling order over argument order', async () => {
  const h = new TestHarness();
  await h.ok('init', 'create rect a 0 0 1 1', 'create circle b 0 0 1', 'create text c 0 0 "C"');
  const before = h.snapshot();
  await h.ok('group g c a');
  assert.deepEqual(h.editor.document.container('g').children.map(s => s.id), ['a', 'c']);
  assert.deepEqual(h.editor.document.root.children.map(s => s.id), ['g', 'b']);
  await h.ok('undo'); assert.equal(h.snapshot(), before);
  await h.ok('redo'); assert.equal(h.editor.document.require('a').parent!.id, 'g');
});

test('cross-parent group uses nearest common ancestor and document preorder', async () => {
  const h = new TestHarness();
  await h.ok('init', 'create g outer', 'create g left in outer', 'create g right in outer',
    'create rect a 0 0 1 1 in left', 'create rect b 0 0 1 1 in right', 'group both b a');
  assert.equal(h.editor.document.require('both').parent!.id, 'outer');
  assert.deepEqual(h.editor.document.container('both').children.map(s => s.id), ['a', 'b']);
});

test('delete whole subtree, restore exact parents and z-order through undo', async () => {
  const h = new TestHarness();
  await h.ok('init', 'create g g', 'create rect a 1 2 3 4 in g', 'create g child in g',
    'create circle b 3 4 5 in child', 'create text z 0 0 "last"');
  const before = h.snapshot();
  await h.ok('delete g'); assert.equal(h.editor.document.count, 1);
  await h.ok('undo'); assert.equal(h.snapshot(), before);
  await h.ok('redo'); assert.equal(h.editor.document.find('b'), undefined);
});

test('ungroup lifts children at the container position, undo restores group', async () => {
  const h = new TestHarness();
  await h.ok('init', 'create g scene', 'create rect a 0 0 1 1 in scene', 'create g nested in scene',
    'create circle b 0 0 1 in nested', 'create circle c 0 0 1 in nested', 'create g tail in scene');
  const before = h.snapshot();
  await h.ok('ungroup nested');
  assert.deepEqual(h.editor.document.container('scene').children.map(s => s.id), ['a', 'b', 'c', 'tail']);
  await h.ok('undo'); assert.equal(h.snapshot(), before);
  await h.failsWithoutChange('ungroup scene', /cannot ungroup top-level container: scene/);
});

test('addto appends and front/back affect only siblings; each is reversible', async () => {
  const h = new TestHarness();
  await h.ok('init', 'create g g', 'create g other', 'create circle a 0 0 1 in g',
    'create circle b 0 0 1 in g', 'create circle c 0 0 1 in other', 'addto g c');
  assert.deepEqual(h.editor.document.container('g').children.map(s => s.id), ['a', 'b', 'c']);
  await h.ok('front a');
  assert.deepEqual(h.editor.document.container('g').children.map(s => s.id), ['b', 'c', 'a']);
  await h.ok('back a');
  assert.deepEqual(h.editor.document.container('g').children.map(s => s.id), ['a', 'b', 'c']);
  await h.ok('undo', 'undo', 'undo');
  assert.equal(h.editor.document.require('c').parent!.id, 'other');
});

test('set geometry/style/text, absence of optional style restored by undo', async () => {
  const h = new TestHarness();
  await h.ok('init', 'create text t 1 2 "original"', 'set t text "new content"', 'set t fill red');
  await h.ok('undo'); assert.equal(h.editor.document.require('t').attributes.fill, undefined);
  await h.ok('undo'); assert.equal(h.editor.document.require('t').textContent, 'original');
  await h.ok('set t x 2.5', 'set t stroke black', 'set t stroke-width 0.5');
  assert.equal(h.editor.document.require('t').attributes.x, '2.5');
});

test('new edit clears redo while display commands and failed edits preserve it', async () => {
  const h = new TestHarness();
  await h.ok('init', 'create circle c 1 2 3', 'move c 5 0', 'undo', 'tree', 'show c', 'help', 'canvas');
  await h.failsWithoutChange('move missing 1 2', /no such shape/);
  await h.ok('redo'); assert.equal(h.editor.document.require('c').attributes.cx, '6');
  await h.ok('undo', 'set c fill red');
  await h.failsWithoutChange('redo', /nothing to redo/);
});

test('IO barriers clear old history; failed IO and dimension changes preserve state/history', async () => {
  const h = new TestHarness();
  await h.ok('init', 'create circle c 1 2 3', 'save demo.svg');
  assert.equal(await h.router.execute('undo'), 'error: undo not allowed after io command');
  await h.ok('move c 1 0', 'undo');
  assert.match(await h.router.execute('undo'), /nothing to undo/);
  await h.ok('redo', 'canvas 400 300');
  assert.match(await h.router.execute('redo'), /undo not allowed after io command/);
  await h.ok('move c 3 0');
  await h.failsWithoutChange('canvas -1 300', /width must be positive/);
  await h.failsWithoutChange('read missing.svg', /cannot read file/);
  h.storage.failWrites();
  await h.failsWithoutChange('save failed.svg', /cannot write file/);
  await h.ok('undo'); assert.equal(h.editor.document.require('c').attributes.cx, '2');
});

test('successful read and init reset paths and block history; save reuses last successful path', async () => {
  const h = new TestHarness();
  await h.ok('init 400', 'create g g', 'save "a file.svg"', 'create circle c 1 2 3', 'save', 'read "a file.svg"');
  assert.equal(h.editor.document.count, 2);
  assert.match(await h.router.execute('undo'), /undo not allowed after io command/);
  await h.ok('init');
  await h.failsWithoutChange('save', /no file path/);
  assert.equal(h.editor.document.size, '800x600');
});

test('invalid edits are atomic, including deep cycles and mixed valid/invalid group targets', async () => {
  const h = new TestHarness();
  await h.ok('init', 'create g g', 'create g nested in g', 'create rect r 1 2 3 4 in nested');
  const cases: [string, RegExp][] = [
    ['create circle r 0 0 1', /id already exists: r/],
    ['create rect new 0 0 1 1 in missing', /no such container: missing/],
    ['create rect new 0 0 1 1 in r', /not a container: r/],
    ['create box box 0 0 1 1 "x"', /unknown shape type: box/],
    ['set r text "bad"', /unknown attribute: text/],
    ['set r id another', /unknown attribute: id/],
    ['set r width -2', /width must be at least 0/],
    ['set r stroke-width -1', /stroke-width must be at least 0/],
    ['scale g 0', /scale factor must be positive/],
    ['scale r -1', /scale factor must be positive/],
    ['move r NaN 0', /finite number/],
    ['create rect bad 0 0 -1 2', /width must be at least 0/],
    ['group bad r missing', /no such shape: missing/],
    ['group bad r g', /cannot group a container into its own descendant: g/],
    ['group bad r r', /duplicate shape/],
    ['addto nested g', /cannot move a container into its own descendant: g/],
    ['addto g g', /cannot move a container into its own descendant: g/],
    ['delete missing', /no such shape: missing/],
  ];
  for (const [line, message] of cases) await h.failsWithoutChange(line, message);
});

test('overflow midway through a Composite edit cannot mutate live document', async () => {
  const h = new TestHarness();
  await h.ok('init', 'create g g', 'create circle a 1 2 3 in g', 'create circle b 1e308 2 3 in g');
  await h.failsWithoutChange('scale g 2', /finite number/);
  await h.ok('undo'); assert.equal(h.editor.document.find('b'), undefined);
});

test('id lookup is case sensitive, optional in suffix cannot consume quoted text', async () => {
  const h = new TestHarness();
  await h.ok('init', 'create g r', 'create g R', 'create text t 1 2 "in"', 'create text t2 1 2 "ends in" in r');
  assert.equal(h.editor.document.count, 4);
  assert.equal(h.editor.document.require('t').textContent, 'in');
  assert.equal(h.editor.document.require('t2').parent!.id, 'r');
});

test('tokenization handles empty text, escaped quotes, Windows paths and full-line comments', async () => {
  const h = new TestHarness();
  await h.ok('init', 'create text empty 0 0 ""', 'create text t 0 0 "say \\"hello\\""'.replace(/\\\\/g, '\\'));
  assert.equal(h.editor.document.require('empty').textContent, '');
  assert.equal(h.editor.document.require('t').textContent, 'say "hello"');
  assert.equal(await h.router.execute('  # comment'), '');
  assert.equal(await h.router.execute('   '), '');
  await h.failsWithoutChange('set t text "broken', /unterminated double quote/);
  assert.match(await h.ok('save "D:\\class work\\test.svg"'), /D:\\class work\\test.svg/);
});

test('argument errors are one line and do not mutate the document', async () => {
  const h = new TestHarness(); await h.ok('init');
  for (const command of ['move', 'tree a b', 'canvas 100', 'create rect r 1 2', 'help extra', 'unknown']) {
    await h.failsWithoutChange(command, /^error: [^\r\n]+$/);
  }
});
