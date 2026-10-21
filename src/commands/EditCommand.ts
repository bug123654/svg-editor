import type { SvgDocument } from '../model/SvgDocument.js';

export abstract class EditCommand {
  #before: SvgDocument | undefined;
  #after: SvgDocument | undefined;
  #feedback = '';
  abstract get description(): string;
  protected abstract apply(document: SvgDocument): string;

  execute(document: SvgDocument): string {
    const staged = document.clone();
    const feedback = this.apply(staged);
    this.#before = document.clone();
    this.#after = staged.clone();
    this.#feedback = feedback;
    document.restore(staged);
    return feedback;
  }
  undo(document: SvgDocument): string {
    if (!this.#before) throw new Error('command has not been executed');
    document.restore(this.#before); return `undone: ${this.description}`;
  }
  redo(document: SvgDocument): string {
    if (!this.#after) throw new Error('command has not been executed');
    document.restore(this.#after); return this.#feedback;
  }
}
