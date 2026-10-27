import { readFile } from 'node:fs/promises';
import { Readable } from 'node:stream';
import type { Repl } from './Repl.js';

export class CliApplication {
  constructor(private readonly repl: Repl) {}

  async run(args: readonly string[]): Promise<number> {
    try {
      if (args.length === 0) {
        await this.repl.run();
      } else {
        if (args.length !== 2 || args[0] !== '--script') {
          throw new Error('usage: npm run cli -- [--script <commands-file>]');
        }
        let source: string;
        try { source = await readFile(args[1]!, 'utf8'); }
        catch { throw new Error(`cannot read script: ${args[1]}`); }
        await this.repl.run(Readable.from([source]), process.stdout, false);
      }
      return 0;
    } catch (error) {
      process.stderr.write(`error: ${(error instanceof Error ? error.message : String(error)).replace(/[\r\n]+/g, ' ')}\n`);
      return 1;
    }
  }
}
