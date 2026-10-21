import { Shape } from './Shape.js';

export class Rectangle extends Shape {
  constructor(id: string, x: number, y: number, width: number, height: number) {
    super(id, 'rect');
    this.define('x', x); this.define('y', y);
    this.define('width', width, true); this.define('height', height, true);
  }
  move(dx: number, dy: number): void { this.shift(['x'], ['y'], dx, dy); }
  clone(): Rectangle {
    return this.copyAppearanceTo(new Rectangle(this.id, this.value('x'), this.value('y'), this.value('width'), this.value('height')));
  }
}
