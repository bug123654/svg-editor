import type { SvgDocument } from '../model/SvgDocument.js';
import { EditCommand } from './EditCommand.js';

export class DeleteCommand extends EditCommand {
  constructor(private readonly id: string) { super(); }
  get description(): string { return `delete ${this.id}`; }
  protected apply(document: SvgDocument): string {
    const shape = document.require(this.id); shape.parent!.remove(shape); return `${shape.label} deleted`;
  }
}
