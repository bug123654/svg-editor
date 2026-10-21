import type { SvgDocument } from '../model/SvgDocument.js';
import { EditCommand } from './EditCommand.js';

export class ScaleCommand extends EditCommand {
  constructor(private readonly id: string, private readonly factor: number) { super(); }
  get description(): string { return `scale ${this.id}`; }
  protected apply(document: SvgDocument): string {
    const shape = document.require(this.id); shape.scale(this.factor); return `${shape.label} scaled by ${this.factor}`;
  }
}
