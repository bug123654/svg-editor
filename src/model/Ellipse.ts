import { Shape } from './Shape.js';

export class Ellipse extends Shape {
  constructor(id: string, cx: number, cy: number, rx: number, ry: number) {
    super(id, 'ellipse'); this.define('cx', cx); this.define('cy', cy);
    this.define('rx', rx, true); this.define('ry', ry, true);
  }
  move(dx: number, dy: number): void { this.shift(['cx'], ['cy'], dx, dy); }
  clone(): Ellipse { return this.copyAppearanceTo(new Ellipse(this.id, this.value('cx'), this.value('cy'), this.value('rx'), this.value('ry'))); }
}
