import { Circle } from './Circle.js';
import { Ellipse } from './Ellipse.js';
import { Group } from './Group.js';
import { Guard } from './Guard.js';
import { Line } from './Line.js';
import { Rectangle } from './Rectangle.js';
import { Shape } from './Shape.js';
import { TextShape } from './TextShape.js';

export class ShapeFactory {
  // The only type-name dispatch site, shared by CLI creation and SVG import.
  readonly #constructors = new Map<string, (id: string) => Shape>([
    ['rect', id => new Rectangle(id, 0, 0, 0, 0)],
    ['circle', id => new Circle(id, 0, 0, 0)],
    ['ellipse', id => new Ellipse(id, 0, 0, 0, 0)],
    ['line', id => new Line(id, 0, 0, 0, 0)],
    ['text', id => new TextShape(id, 0, 0, '')],
    ['g', id => new Group(id)],
  ]);

  create(type: string, id: string): Shape {
    const create = this.#constructors.get(type);
    if (!create) throw new Error(`unknown shape type: ${type} (is the plugin loaded?)`);
    return create(id);
  }

  fromArguments(type: string, id: string, values: readonly string[]): Shape {
    const shape = this.create(type, id);
    const keys = Object.keys(shape.attributes).filter(key => key !== 'id');
    const count = keys.length + (shape instanceof TextShape ? 1 : 0);
    const optionalStyle = shape instanceof TextShape || shape instanceof Group ? undefined : shape instanceof Line ? 'stroke' : 'fill';
    if (values.length < count || values.length > count + (optionalStyle ? 1 : 0)) {
      throw new Error(`invalid parameters for ${type}: expected ${count}${optionalStyle ? ' or ' + (count + 1) : ''}, got ${values.length}`);
    }
    keys.forEach((key, i) => shape.setAttribute(key, String(Guard.number(values[i]!, key))));
    if (shape instanceof TextShape) shape.setAttribute('text', values[count - 1]!);
    if (optionalStyle && values.length > count) shape.setAttribute(optionalStyle, values[count]!);
    return shape;
  }
}
