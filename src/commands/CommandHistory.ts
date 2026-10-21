import type { SvgDocument } from '../model/SvgDocument.js';
import type { EditCommand } from './EditCommand.js';

export class CommandHistory {
  readonly #undo: EditCommand[] = [];
  readonly #redo: EditCommand[] = [];
  #blocked = true;
  execute(command: EditCommand, document: SvgDocument): string {
    const message = command.execute(document);
    this.#undo.push(command); this.#redo.length = 0; this.#blocked = false;
    return message;
  }
  barrier(): void { this.#undo.length = 0; this.#redo.length = 0; this.#blocked = true; }
  undo(document: SvgDocument): string {
    this.assertAllowed();
    const command = this.#undo.at(-1);
    if (!command) throw new Error('nothing to undo');
    const result = command.undo(document); this.#undo.pop(); this.#redo.push(command); return result;
  }
  redo(document: SvgDocument): string {
    this.assertAllowed();
    const command = this.#redo.at(-1);
    if (!command) throw new Error('nothing to redo');
    const result = command.redo(document); this.#redo.pop(); this.#undo.push(command); return result;
  }
  private assertAllowed(): void { if (this.#blocked) throw new Error('undo not allowed after io command'); }
}
