import type { SvgDocument } from '../model/SvgDocument.js';
import { EditCommand } from './EditCommand.js';

export class MoveCommand extends EditCommand {
  constructor(private readonly id: string, private readonly dx: number, private readonly dy: number) { super(); }
  get description(): string { return `move ${this.id}`; }
  protected apply(document: SvgDocument): string {
    const shape = document.require(this.id); shape.move(this.dx, this.dy);
    return `${shape.label} moved by (${this.dx},${this.dy})`;
  }
}
