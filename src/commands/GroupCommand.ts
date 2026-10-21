import { Group } from '../model/Group.js';
import type { SvgDocument } from '../model/SvgDocument.js';
import { EditCommand } from './EditCommand.js';

export class GroupCommand extends EditCommand {
  constructor(private readonly id: string, private readonly ids: readonly string[]) { super(); }
  get description(): string { return `group ${this.id}`; }
  protected apply(document: SvgDocument): string {
    document.assertAvailable(this.id);
    if (this.ids.length < 1) throw new Error('group requires at least one shape');
    if (new Set(this.ids).size !== this.ids.length) throw new Error('duplicate shape in group');
    const selected = new Set(this.ids.map(id => document.require(id)));
    for (const shape of selected) {
      for (const other of selected) {
        if (other !== shape && shape.contains(other)) throw new Error(`cannot group a container into its own descendant: ${shape.id}`);
      }
    }
    // Deterministic cross-parent rule: original document preorder, nearest common parent.
    const ordered = document.shapes.filter(shape => selected.has(shape));
    let parent = ordered[0]!.parent!;
    while (!ordered.every(shape => parent.contains(shape))) parent = parent.parent!;
    const insertion = parent.children.findIndex(child => ordered.some(shape => child.contains(shape)));
    const group = new Group(this.id);
    for (const shape of ordered) group.insert(shape);
    parent.insert(group, insertion);
    return `${group.label} created with ${ordered.length} children`;
  }
}
