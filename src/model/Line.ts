import { Shape } from './Shape.js';

export class Line extends Shape {
  constructor(id: string, x1: number, y1: number, x2: number, y2: number) {
    super(id, 'line'); this.define('x1', x1); this.define('y1', y1); this.define('x2', x2); this.define('y2', y2);
  }
  move(dx: number, dy: number): void { this.shift(['x1', 'x2'], ['y1', 'y2'], dx, dy); }
  clone(): Line { return this.copyAppearanceTo(new Line(this.id, this.value('x1'), this.value('y1'), this.value('x2'), this.value('y2'))); }
}
