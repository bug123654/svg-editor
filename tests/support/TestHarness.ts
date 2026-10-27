import assert from 'node:assert/strict';
import { Editor } from '../../src/application/Editor.js';
import { CommandRouter } from '../../src/cli/CommandRouter.js';
import { SvgCodec } from '../../src/io/SvgCodec.js';
import { MemoryStorage } from './MemoryStorage.js';

export class TestHarness {
  readonly storage = new MemoryStorage();
  readonly editor = new Editor(this.storage);
  readonly router = new CommandRouter(this.editor);
  async ok(...lines: string[]): Promise<string> {
    let result = '';
    for (const line of lines) {
      result = await this.router.execute(line);
      assert.ok(!result.startsWith('error:'), `${line}\n${result}`);
    }
    return result;
  }
  snapshot(): string { return new SvgCodec().encode(this.editor.document); }
  async failsWithoutChange(line: string, message: RegExp): Promise<void> {
    const before = this.snapshot();
    assert.match(await this.router.execute(line), message);
    assert.equal(this.snapshot(), before, `state changed after failure: ${line}`);
  }
}
