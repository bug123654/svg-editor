import type { DocumentStorage } from '../../src/application/DocumentStorage.js';
import { SvgCodec } from '../../src/io/SvgCodec.js';
import type { SvgDocument } from '../../src/model/SvgDocument.js';

export class MemoryStorage implements DocumentStorage {
  readonly #files = new Map<string, string>();
  readonly #codec = new SvgCodec();
  #failWrite = false;
  setSource(path: string, source: string): void { this.#files.set(path, source); }
  failWrites(): void { this.#failWrite = true; }
  async read(path: string): Promise<ReturnType<SvgCodec['decode']>> {
    const source = this.#files.get(path);
    if (source === undefined) throw new Error(`cannot read file: ${path}`);
    return this.#codec.decode(source);
  }
  async write(path: string, document: SvgDocument): Promise<void> {
    if (this.#failWrite) throw new Error(`cannot write file: ${path}`);
    this.#files.set(path, this.#codec.encode(document));
  }
}
