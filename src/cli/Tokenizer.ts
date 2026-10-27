import { Token } from './Token.js';

export class Tokenizer {
  tokenize(line: string): Token[] {
    if (line.trimStart().startsWith('#')) return [];
    const tokens: Token[] = [];
    let value = ''; let inside = false; let started = false; let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const character = line[i]!;
      if (inside && character === '\\' && (line[i + 1] === '"' || line[i + 1] === '\\')) {
        value += line[++i]!; continue;
      }
      if (character === '"') { inside = !inside; started = true; quoted = true; continue; }
      if (!inside && /\s/u.test(character)) {
        if (started) tokens.push(new Token(value, quoted));
        value = ''; started = false; quoted = false; continue;
      }
      value += character; started = true;
    }
    if (inside) throw new Error('unterminated double quote');
    if (started) tokens.push(new Token(value, quoted));
    return tokens;
  }
}
