import { Editor } from '../application/Editor.js';
import { AddToCommand } from '../commands/AddToCommand.js';
import { CreateCommand } from '../commands/CreateCommand.js';
import { DeleteCommand } from '../commands/DeleteCommand.js';
import { GroupCommand } from '../commands/GroupCommand.js';
import { MoveCommand } from '../commands/MoveCommand.js';
import { OrderCommand } from '../commands/OrderCommand.js';
import { ScaleCommand } from '../commands/ScaleCommand.js';
import { SetCommand } from '../commands/SetCommand.js';
import { UngroupCommand } from '../commands/UngroupCommand.js';
import { Guard } from '../model/Guard.js';
import { ShapeFactory } from '../model/ShapeFactory.js';
import type { Token } from './Token.js';
import { Tokenizer } from './Tokenizer.js';

export class CommandRouter {
  readonly #tokenizer = new Tokenizer();
  readonly #factory = new ShapeFactory();
  readonly #routes: Map<string, { syntax: string; min: number; max: number; run: (args: readonly Token[]) => string | Promise<string> }>;
  constructor(private readonly editor: Editor) {
    // The only command-name dispatch site; help is derived from this same table.
    this.#routes = new Map([
      ['init', { syntax: 'init [w] [h]', min: 0, max: 2, run: a => this.editor.init(a[0] ? this.number(a, 0) : 800, a[1] ? this.number(a, 1) : 600) }],
      ['read', { syntax: 'read <file.svg>', min: 1, max: 1, run: a => this.editor.read(a[0]!.value) }],
      ['save', { syntax: 'save [file.svg]', min: 0, max: 1, run: a => this.editor.save(a[0]?.value) }],
      ['canvas', { syntax: 'canvas [w h]', min: 0, max: 2, run: a => {
        if (a.length === 1) throw new Error('usage: canvas [w h]');
        return a.length ? this.editor.canvas(this.number(a, 0), this.number(a, 1)) : this.editor.canvas();
      } }],
      ['create', { syntax: 'create <rect|circle|ellipse|line|text|g> <id> [params...] [in <containerId>]', min: 2, max: Infinity, run: a => this.create(a) }],
      ['delete', { syntax: 'delete <id>', min: 1, max: 1, run: a => this.editor.edit(new DeleteCommand(a[0]!.value)) }],
      ['move', { syntax: 'move <id> <dx> <dy>', min: 3, max: 3, run: a => this.editor.edit(new MoveCommand(a[0]!.value, this.number(a, 1), this.number(a, 2))) }],
      ['scale', { syntax: 'scale <id> <factor>', min: 2, max: 2, run: a => this.editor.edit(new ScaleCommand(a[0]!.value, this.number(a, 1))) }],
      ['set', { syntax: 'set <id> <attr> <value>', min: 3, max: 3, run: a => this.editor.edit(new SetCommand(a[0]!.value, a[1]!.value, a[2]!.value)) }],
      ['group', { syntax: 'group <newGid> <id1> <id2>...', min: 2, max: Infinity, run: a => this.editor.edit(new GroupCommand(a[0]!.value, a.slice(1).map(token => token.value))) }],
      ['ungroup', { syntax: 'ungroup <gid>', min: 1, max: 1, run: a => this.editor.edit(new UngroupCommand(a[0]!.value)) }],
      ['addto', { syntax: 'addto <gid> <id>', min: 2, max: 2, run: a => this.editor.edit(new AddToCommand(a[0]!.value, a[1]!.value)) }],
      ['front', { syntax: 'front <id>', min: 1, max: 1, run: a => this.editor.edit(new OrderCommand(a[0]!.value, true)) }],
      ['back', { syntax: 'back <id>', min: 1, max: 1, run: a => this.editor.edit(new OrderCommand(a[0]!.value, false)) }],
      ['tree', { syntax: 'tree [id]', min: 0, max: 1, run: a => this.editor.tree(a[0]?.value) }],
      ['show', { syntax: 'show <id>', min: 1, max: 1, run: a => this.editor.show(a[0]!.value) }],
      ['help', { syntax: 'help', min: 0, max: 0, run: () => this.help() }],
      ['undo', { syntax: 'undo', min: 0, max: 0, run: () => this.editor.undo() }],
      ['redo', { syntax: 'redo', min: 0, max: 0, run: () => this.editor.redo() }],
    ]);
  }
  async execute(line: string): Promise<string> {
    try {
      const tokens = this.#tokenizer.tokenize(line);
      if (!tokens.length) return '';
      const route = this.#routes.get(tokens[0]!.value);
      if (!route) throw new Error(`unknown command: ${tokens[0]!.value}`);
      const args = tokens.slice(1);
      if (args.length < route.min || args.length > route.max) throw new Error(`usage: ${route.syntax}`);
      return await route.run(args);
    } catch (error) {
      return `error: ${(error instanceof Error ? error.message : String(error)).replace(/[\r\n]+/g, ' ')}`;
    }
  }
  private number(args: readonly Token[], index: number): number { return Guard.number(args[index]!.value, 'argument'); }
  private create(args: readonly Token[]): string {
    // Resolve document first, including when shape arguments would also be invalid.
    void this.editor.document;
    let values = args.slice(2); let parent: string | undefined;
    const marker = values.at(-2);
    if (marker?.value === 'in' && !marker.quoted) { parent = values.at(-1)!.value; values = values.slice(0, -2); }
    const shape = this.#factory.fromArguments(args[0]!.value, args[1]!.value, values.map(token => token.value));
    return this.editor.edit(new CreateCommand(shape, parent));
  }
  private help(): string {
    return [...this.#routes.values()].map(route => route.syntax).join('\n')
      + '\n\nShape parameters:\n' + this.#factory.syntax().join('\n')
      + '\n# Lines starting with # are comments. Exit with Ctrl+C or end of input.';
  }
}
