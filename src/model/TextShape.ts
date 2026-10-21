import { Shape } from './Shape.js';
import { Guard } from './Guard.js';

export class TextShape extends Shape {
  #text: string;
  constructor(id: string, x: number, y: number, text: string) {
    super(id, 'text'); this.define('x', x); this.define('y', y); Guard.xml(text); this.#text = text;
  }
  override get textContent(): string { return this.#text; }
  override setAttribute(name: string, value: string): void {
    if (name === 'text') { Guard.xml(value); this.#text = value; return; }
    super.setAttribute(name, value);
  }
  move(dx: number, dy: number): void { this.shift(['x'], ['y'], dx, dy); }
  clone(): TextShape { return this.copyAppearanceTo(new TextShape(this.id, this.value('x'), this.value('y'), this.#text)); }
}
