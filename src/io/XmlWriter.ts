import type { ShapeWriter } from '../model/ShapeWriter.js';

export class XmlWriter implements ShapeWriter {
  readonly #parts: string[] = ['<?xml version="1.0" encoding="UTF-8"?>\n'];
  readonly #frames: { tag: string; hasChildren: boolean }[] = [];
  open(tag: string, attributes: Readonly<Record<string, string>>): void {
    const parent = this.#frames.at(-1);
    if (parent) { parent.hasChildren = true; this.#parts.push('\n' + '  '.repeat(this.#frames.length)); }
    const attrs = Object.entries(attributes).map(([key, value]) => ` ${key}="${this.escape(value, true)}"`).join('');
    this.#parts.push(`<${tag}${attrs}>`); this.#frames.push({ tag, hasChildren: false });
  }
  text(content: string): void { this.#parts.push(this.escape(content)); }
  close(tag: string): void {
    const frame = this.#frames.pop();
    if (!frame || frame.tag !== tag) throw new Error('unbalanced XML writer');
    if (frame.hasChildren) this.#parts.push('\n' + '  '.repeat(this.#frames.length));
    this.#parts.push(`</${tag}>`);
  }
  finish(): string {
    if (this.#frames.length) throw new Error('unclosed XML element');
    return this.#parts.join('') + '\n';
  }
  private escape(value: string, attribute = false): string {
    const escaped = value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return attribute ? escaped.replace(/"/g, '&quot;').replace(/\r/g, '&#13;').replace(/\n/g, '&#10;').replace(/\t/g, '&#9;') : escaped.replace(/\r/g, '&#13;');
  }
}
