export class Guard {
  static number(value: string | number, name: string, minimum = -Infinity): number {
    if (typeof value === 'string' && !/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(value.trim())) {
      throw new Error(`${name} must be a finite number`);
    }
    const result = Number(value);
    if (!Number.isFinite(result)) throw new Error(`${name} must be a finite number`);
    if (result < minimum) throw new Error(`${name} must be at least ${minimum}`);
    return Object.is(result, -0) ? 0 : result;
  }

  static positive(value: string | number, name: string): number {
    const result = this.number(value, name);
    if (result <= 0) throw new Error(`${name} must be positive`);
    return result;
  }

  static id(value: string): void {
    if (!value || /[\s\u0000-\u001f<>"'&]/u.test(value)) throw new Error(`invalid id: ${value}`);
  }

  static xml(value: string): void {
    if (/[^\u0009\u000a\u000d\u0020-\ud7ff\ue000-\ufffd\u{10000}-\u{10ffff}]/u.test(value)) {
      throw new Error('text contains a character invalid in XML');
    }
  }
}
