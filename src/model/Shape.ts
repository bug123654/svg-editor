import { Guard } from './Guard.js';
import type { Group } from './Group.js';
import type { ShapeWriter } from './ShapeWriter.js';

export abstract class Shape {
  readonly #id: string;
  readonly #tag: string;
  #parent: Group | undefined;
  readonly #geometry = new Map<string, number>();
  readonly #nonnegative = new Set<string>();
  readonly #style = new Map<string, string>();
  readonly #presentation = new Map<string, string>();

  protected constructor(id: string, tag: string) {
    Guard.id(id);
    this.#id = id;
    this.#tag = tag;
  }

  get id(): string { return this.#id; }
  get tag(): string { return this.#tag; }
  get label(): string { return `${this.tag}#${this.id}`; }
  get parent(): Group | undefined { return this.#parent; }
  get children(): readonly Shape[] { return []; }
  get textContent(): string | undefined { return undefined; }

  /** Group is the sole owner of parent/child mutations. */
  bindParent(parent: Group | undefined): void { this.#parent = parent; }

  protected define(name: string, value: number, nonnegative = false): void {
    if (nonnegative) this.#nonnegative.add(name);
    this.#geometry.set(name, Guard.number(value, name, nonnegative ? 0 : -Infinity));
  }

  protected value(name: string): number {
    const value = this.#geometry.get(name);
    if (value === undefined) throw new Error(`unknown attribute: ${name}`);
    return value;
  }

  protected shift(xs: readonly string[], ys: readonly string[], dx: number, dy: number): void {
    Guard.number(dx, 'dx'); Guard.number(dy, 'dy');
    for (const key of xs) this.setAttribute(key, String(this.value(key) + dx));
    for (const key of ys) this.setAttribute(key, String(this.value(key) + dy));
  }

  abstract move(dx: number, dy: number): void;
  abstract clone(): Shape;

  scale(factor: number): void {
    Guard.positive(factor, 'scale factor');
    for (const [key, value] of this.#geometry) this.setAttribute(key, String(value * factor));
  }

  setAttribute(name: string, value: string): void {
    if (this.#geometry.has(name)) {
      this.#geometry.set(name, Guard.number(value, name, this.#nonnegative.has(name) ? 0 : -Infinity));
      return;
    }
    if (name === 'fill' || name === 'stroke') {
      Guard.xml(value);
      if (!value.trim()) throw new Error(`${name} must not be empty`);
      this.#style.set(name, value);
      return;
    }
    if (name === 'stroke-width') {
      this.#style.set(name, String(Guard.number(value, name, 0)));
      return;
    }
    throw new Error(`unknown attribute: ${name}`);
  }

  /** Read-only preservation of a small set of SVG presentation attributes. */
  preservePresentation(name: string, value: string): void {
    Guard.xml(value);
    this.#presentation.set(name, value);
  }

  get attributes(): Readonly<Record<string, string>> {
    return Object.fromEntries([
      ['id', this.id], ...[...this.#geometry].map(([key, value]) => [key, String(value)]),
      ...this.#style, ...this.#presentation,
    ]);
  }

  protected copyAppearanceTo<T extends Shape>(target: T): T {
    for (const [name, value] of this.#style) target.setAttribute(name, value);
    for (const [name, value] of this.#presentation) target.preservePresentation(name, value);
    return target;
  }

  contains(shape: Shape): boolean { return this === shape; }
  *walk(): IterableIterator<Shape> { yield this; }

  describe(): string {
    const attributes = Object.entries(this.attributes).filter(([key]) => key !== 'id');
    const text = this.textContent === undefined ? '' : ` ${JSON.stringify(this.textContent)}`;
    return `${this.label}${attributes.length ? '  ' : ''}${attributes.map(([k, v]) => `${k}=${v}`).join(' ')}${text}`;
  }

  writeTo(writer: ShapeWriter): void {
    writer.open(this.tag, this.attributes);
    if (this.textContent !== undefined) writer.text(this.textContent);
    for (const child of this.children) child.writeTo(writer);
    writer.close(this.tag);
  }
}
