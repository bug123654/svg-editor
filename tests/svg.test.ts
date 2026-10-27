import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { SvgCodec } from '../src/io/SvgCodec.js';
import { TestHarness } from './support/TestHarness.js';

test('provided other.svg loads seven elements, emits warning and roundtrips unchanged', async () => {
  const codec = new SvgCodec();
  const loaded = codec.decode(await readFile('examples/other.svg', 'utf8'));
  assert.equal(loaded.document.count, 7);
  assert.deepEqual(loaded.warnings, ['warning: assigned id rect1 to unnamed <rect>']);
  const encoded = codec.encode(loaded.document);
  assert.equal(codec.encode(codec.decode(encoded).document), encoded);
});

test('auto ids reserve all explicit ids before generation, including later siblings', () => {
  const result = new SvgCodec().decode('<svg width="100" height="100"><rect/><g><rect id="rect1"/><rect/></g><g id="g1"/></svg>');
  assert.deepEqual(result.warnings, [
    'warning: assigned id rect2 to unnamed <rect>',
    'warning: assigned id g2 to unnamed <g>',
    'warning: assigned id rect3 to unnamed <rect>',
  ]);
  assert.equal(result.document.count, 5);
  assert.equal(new Set(result.document.shapes.map(shape => shape.id)).size, 5);
});

test('XML escaping preserves Unicode, quotes, ampersands, angle brackets and whitespace', async () => {
  const h = new TestHarness();
  await h.ok('init', 'create text t 1 2 "<开始> & \\"quoted\\""'.replace(/\\\\/g, '\\'));
  h.editor.document.require('t').setAttribute('text', '<开始> & "quoted"\nnext\tline\rreturn');
  h.editor.document.require('t').setAttribute('fill', 'url("#x&y")');
  const codec = new SvgCodec(); const xml = h.snapshot();
  assert.match(xml, /&lt;开始&gt; &amp;/);
  assert.match(xml, /&quot;#x&amp;y&quot;/);
  const reread = codec.decode(xml).document;
  assert.equal(reread.require('t').textContent, h.editor.document.require('t').textContent);
  assert.equal(reread.require('t').attributes.fill, 'url("#x&y")');
});

test('group and root presentation inheritance and plugin marker are preserved as ordinary g', () => {
  const codec = new SvgCodec();
  const result = codec.decode('<svg xmlns="http://www.w3.org/2000/svg" width="100px" height="50px" fill="red"><g id="box" data-kind="box"><text id="t" font-size="16" text-anchor="middle">title</text></g></svg>');
  const xml = codec.encode(result.document);
  assert.match(xml, /fill="red"/); assert.match(xml, /data-kind="box"/);
  assert.match(xml, /font-size="16"/); assert.match(xml, /text-anchor="middle"/);
  assert.equal(result.document.container('box').tag, 'g');
  assert.equal(codec.encode(codec.decode(xml).document), xml);
});

test('invalid SVG import fails without replacing live document or history', async () => {
  const h = new TestHarness(); await h.ok('init', 'create circle original 1 2 3');
  const invalid = [
    '<svg width="100" height="100"><rect id="r"/><circle id="r"/></svg>',
    '<svg width="100" height="100"><rect id=""/></svg>',
    '<svg width="100" height="100"><rect id="r" width="-1"/></svg>',
    '<svg width="100" height="100"><rect id="r"></svg>',
    '<svg width="100" height="100"><path id="p" d="M0 0"/></svg>',
    '<svg width="100" height="100"><g id="g" transform="translate(10,20)"/></svg>',
    '<svg width="100" height="100" viewBox="0 0 200 200"/>',
    '<svg width="100" height="100"><text id="t"><tspan>nested</tspan></text></svg>',
    '<svg width="100" height="100"><g id="g">unexpected</g></svg>',
    '<svg width="100" height="100"><rect id="r" style="fill:red"/></svg>',
    '<svg xmlns="urn:foreign" width="100" height="100"/>',
    '<svg width="100" height="100"><rect xmlns="urn:foreign"/></svg>',
    '<!DOCTYPE svg [<!ENTITY x "text">]><svg width="100" height="100"/>',
    '<svg width="NaN" height="100"/>',
    '<svg height="100"/>',
    '<html/>',
  ];
  for (const source of invalid) {
    h.storage.setSource('bad.svg', source);
    await h.failsWithoutChange('read bad.svg', /^error:/);
  }
  await h.ok('undo'); assert.equal(h.editor.document.count, 0);
});

test('comments and XML declaration do not become shapes; text whitespace survives', () => {
  const codec = new SvgCodec();
  const result = codec.decode('<?xml version="1.0"?><svg width="10" height="10"><!-- comment --><text id="t">  hello  </text></svg>');
  assert.equal(result.document.count, 1);
  assert.equal(result.document.require('t').textContent, '  hello  ');
});
