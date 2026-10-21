import type { Shape } from '../model/Shape.js';
import type { SvgDocument } from '../model/SvgDocument.js';
import { EditCommand } from './EditCommand.js';

export class CreateCommand extends EditCommand {
  constructor(private readonly shape: Shape, private readonly parentId?: string) { super(); }
  get description(): string { return `create ${this.shape.label}`; }
  protected apply(document: SvgDocument): string {
    document.add(this.shape.clone(), this.parentId);
    return `${this.shape.label} created${this.parentId === undefined ? '' : ` in g#${this.parentId}`}`;
  }
}
