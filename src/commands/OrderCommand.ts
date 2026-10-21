import type { SvgDocument } from '../model/SvgDocument.js';
import { EditCommand } from './EditCommand.js';

export class OrderCommand extends EditCommand {
  constructor(private readonly id: string, private readonly front: boolean) { super(); }
  get description(): string { return `${this.front ? 'front' : 'back'} ${this.id}`; }
  protected apply(document: SvgDocument): string {
    const shape = document.require(this.id); const parent = shape.parent!;
    parent.remove(shape); parent.insert(shape, this.front ? parent.children.length : 0);
    return `${shape.label} moved to ${this.front ? 'front' : 'back'}`;
  }
}
