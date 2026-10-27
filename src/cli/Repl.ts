import { createInterface } from 'node:readline';
import type { Readable, Writable } from 'node:stream';
import type { CommandRouter } from './CommandRouter.js';

export class Repl {
  constructor(private readonly router: CommandRouter) {}
  async run(input: Readable = process.stdin, output: Writable = process.stdout, interactive = Boolean(process.stdin.isTTY)): Promise<void> {
    const lines = createInterface({ input, output, terminal: interactive });
    lines.setPrompt('svg> ');
    output.write("svg-editor 0.1 — type 'help' for commands\n");
    if (interactive) lines.prompt();
    for await (const line of lines) {
      const result = await this.router.execute(line);
      if (result) output.write(result + '\n');
      if (interactive) lines.prompt();
    }
  }
}
