import type { SvgDocument } from '../model/SvgDocument.js';
import { EditCommand } from './EditCommand.js';

export class UngroupCommand extends EditCommand {
  constructor(private readonly id: string) { super(); }
  get description(): string { return `ungroup ${this.id}`; }
  protected apply(document: SvgDocument): string {
    const group = document.container(this.id);
    const parent = group.parent!;
    if (parent === document.root) throw new Error(`cannot ungroup top-level container: ${this.id}`);
    const index = parent.remove(group);
    group.children.forEach((child, i) => parent.insert(child, index + i));
    return `g#${this.id} ungrouped`;
  }
}
