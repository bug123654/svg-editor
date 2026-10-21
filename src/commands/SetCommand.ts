import type { SvgDocument } from '../model/SvgDocument.js';
import { EditCommand } from './EditCommand.js';

export class SetCommand extends EditCommand {
  constructor(private readonly id: string, private readonly attribute: string, private readonly value: string) { super(); }
  get description(): string { return `set ${this.id} ${this.attribute}`; }
  protected apply(document: SvgDocument): string {
    const shape = document.require(this.id); shape.setAttribute(this.attribute, this.value);
    return `${shape.label} updated: ${this.attribute}=${JSON.stringify(this.value)}`;
  }
}
