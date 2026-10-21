import type { SvgDocument } from '../model/SvgDocument.js';
import { EditCommand } from './EditCommand.js';

export class AddToCommand extends EditCommand {
  constructor(private readonly groupId: string, private readonly id: string) { super(); }
  get description(): string { return `addto ${this.groupId} ${this.id}`; }
  protected apply(document: SvgDocument): string {
    const group = document.container(this.groupId); const shape = document.require(this.id);
    group.insert(shape); return `${shape.label} moved into ${group.label}`;
  }
}
