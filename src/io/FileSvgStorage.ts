import { open, readFile, rename, unlink } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { basename, dirname, resolve } from 'node:path';
import type { DocumentStorage } from '../application/DocumentStorage.js';
import type { SvgDocument } from '../model/SvgDocument.js';
import { SvgCodec } from './SvgCodec.js';

export class FileSvgStorage implements DocumentStorage {
  constructor(private readonly baseDirectory = process.cwd(), private readonly codec = new SvgCodec()) {}
  async read(path: string): Promise<{ document: SvgDocument; warnings: readonly string[] }> {
    let source: string;
    try { source = await readFile(resolve(this.baseDirectory, path), 'utf8'); }
    catch { throw new Error(`cannot read file: ${path}`); }
    try { return this.codec.decode(source); }
    catch (error) { throw new Error(`cannot read file: ${path} (${error instanceof Error ? error.message : String(error)})`); }
  }
  async write(path: string, document: SvgDocument): Promise<void> {
    const target = resolve(this.baseDirectory, path);
    const temporary = resolve(dirname(target), `.${basename(target)}.${randomUUID()}.tmp`);
    let handle: Awaited<ReturnType<typeof open>> | undefined;
    try {
      const data = this.codec.encode(document);
      handle = await open(temporary, 'wx');
      await handle.writeFile(data, 'utf8'); await handle.close(); handle = undefined;
      await rename(temporary, target);
    } catch { throw new Error(`cannot write file: ${path}`); }
    finally {
      await handle?.close().catch(() => undefined);
      await unlink(temporary).catch(() => undefined);
    }
  }
}
