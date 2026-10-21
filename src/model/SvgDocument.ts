import { Group } from './Group.js';
import { Guard } from './Guard.js';
import type { Shape } from './Shape.js';

export class SvgDocument {
  #width: number;
  #height: number;
  #root = new Group('__document_root__');
  constructor(width = 800, height = 600) {
    this.#width = Guard.positive(width, 'width'); this.#height = Guard.positive(height, 'height');
  }
  get width(): number { return this.#width; }
  get height(): number { return this.#height; }
  get root(): Group { return this.#root; }
  get size(): string { return `${this.width}x${this.height}`; }
  get shapes(): readonly Shape[] { return this.root.children.flatMap(child => [...child.walk()]); }
  get count(): number { return this.shapes.length; }
  find(id: string): Shape | undefined { return this.shapes.find(shape => shape.id === id); }
  require(id: string): Shape {
    const shape = this.find(id); if (!shape) throw new Error(`no such shape: ${id}`); return shape;
  }
  container(id?: string): Group {
    if (id === undefined) return this.root;
    const shape = this.find(id);
    if (!shape) throw new Error(`no such container: ${id}`);
    if (!(shape instanceof Group)) throw new Error(`not a container: ${id}`);
    return shape;
  }
  assertAvailable(id: string): void {
    Guard.id(id); if (this.find(id)) throw new Error(`id already exists: ${id}`);
  }
  add(shape: Shape, parentId?: string): void {
    const seen = new Set<string>();
    for (const member of shape.walk()) {
      this.assertAvailable(member.id);
      if (seen.has(member.id)) throw new Error(`id already exists: ${member.id}`);
      seen.add(member.id);
    }
    this.container(parentId).insert(shape);
  }
  resize(width: number, height: number): void {
    const w = Guard.positive(width, 'width'); const h = Guard.positive(height, 'height');
    this.#width = w; this.#height = h;
  }
  clone(): SvgDocument {
    const result = new SvgDocument(this.width, this.height); result.#root = this.root.clone(); return result;
  }
  restore(snapshot: SvgDocument): void {
    this.#root = snapshot.root.clone(); this.#width = snapshot.width; this.#height = snapshot.height;
  }
}
