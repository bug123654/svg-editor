import { Shape } from './Shape.js';
import { Guard } from './Guard.js';

export class Group extends Shape {
  readonly #children: Shape[] = [];
  constructor(id: string) { super(id, 'g'); }
  override get children(): readonly Shape[] { return [...this.#children]; }

  insert(shape: Shape, index = this.#children.length): void {
    if (shape.contains(this)) throw new Error(`cannot move a container into its own descendant: ${shape.id}`);
    shape.parent?.remove(shape);
    this.#children.splice(Math.max(0, Math.min(index, this.#children.length)), 0, shape);
    shape.bindParent(this);
  }

  remove(shape: Shape): number {
    const index = this.#children.indexOf(shape);
    if (index < 0) throw new Error(`shape is not a child: ${shape.id}`);
    this.#children.splice(index, 1); shape.bindParent(undefined); return index;
  }

  override contains(shape: Shape): boolean { return this === shape || this.#children.some(child => child.contains(shape)); }
  override *walk(): IterableIterator<Shape> { yield this; for (const child of this.#children) yield* child.walk(); }
  move(dx: number, dy: number): void {
    Guard.number(dx, 'dx'); Guard.number(dy, 'dy');
    for (const child of this.#children) child.move(dx, dy);
  }
  override scale(factor: number): void {
    Guard.positive(factor, 'scale factor');
    for (const child of this.#children) child.scale(factor);
  }
  clone(): Group {
    const result = this.copyAppearanceTo(new Group(this.id));
    for (const child of this.#children) result.insert(child.clone());
    return result;
  }
}
