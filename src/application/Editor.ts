import { CommandHistory } from '../commands/CommandHistory.js';
import type { EditCommand } from '../commands/EditCommand.js';
import { SvgDocument } from '../model/SvgDocument.js';
import type { DocumentStorage } from './DocumentStorage.js';
import { DocumentView } from './DocumentView.js';

export class Editor {
  #document: SvgDocument | undefined;
  #path: string | undefined;
  readonly #history = new CommandHistory();
  readonly #view = new DocumentView();
  constructor(private readonly storage: DocumentStorage) {}
  get document(): SvgDocument {
    if (!this.#document) throw new Error("no document. use 'init' or 'read' first");
    return this.#document;
  }
  init(width = 800, height = 600): string {
    const document = new SvgDocument(width, height);
    this.#document = document; this.#path = undefined; this.#history.barrier();
    return `canvas ${document.size} created`;
  }
  async read(path: string): Promise<string> {
    const result = await this.storage.read(path);
    this.#document = result.document; this.#path = path; this.#history.barrier();
    return [...result.warnings, `read ${path} (${result.document.count} elements)`].join('\n');
  }
  async save(path?: string): Promise<string> {
    const document = this.document;
    const target = path ?? this.#path;
    if (!target) throw new Error('no file path. use save <file.svg>');
    await this.storage.write(target, document);
    this.#path = target; this.#history.barrier();
    return `saved to ${target} (${document.count} elements)`;
  }
  canvas(width?: number, height?: number): string {
    const document = this.document;
    if (width === undefined && height === undefined) return `canvas ${document.size}`;
    if (width === undefined || height === undefined) throw new Error('usage: canvas [w h]');
    document.resize(width, height); this.#history.barrier(); return `canvas resized to ${document.size}`;
  }
  edit(command: EditCommand): string { return this.#history.execute(command, this.document); }
  undo(): string { return this.#history.undo(this.document); }
  redo(): string { return this.#history.redo(this.document); }
  tree(id?: string): string { return this.#view.tree(this.document, id); }
  show(id: string): string { return this.#view.show(this.document, id); }
}
