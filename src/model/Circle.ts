import { Shape } from './Shape.js';

export class Circle extends Shape {
  constructor(id: string, cx: number, cy: number, r: number) {
    super(id, 'circle'); this.define('cx', cx); this.define('cy', cy); this.define('r', r, true);
  }
  move(dx: number, dy: number): void { this.shift(['cx'], ['cy'], dx, dy); }
  clone(): Circle { return this.copyAppearanceTo(new Circle(this.id, this.value('cx'), this.value('cy'), this.value('r'))); }
}
