import type { Shape } from '../model/Shape.js';
import type { SvgDocument } from '../model/SvgDocument.js';

export class DocumentView {
  tree(document: SvgDocument, id?: string): string {
    const lines: string[] = [];
    const visit = (shape: Shape, prefix: string, connector: string): void => {
      lines.push(prefix + connector + shape.describe());
      const next = prefix + (connector === '' ? '' : connector === '└── ' ? '    ' : '│   ');
      shape.children.forEach((child, i, children) => visit(child, next, i === children.length - 1 ? '└── ' : '├── '));
    };
    if (id !== undefined) visit(document.require(id), '', '');
    else {
      lines.push(`svg (${document.size})`);
      document.root.children.forEach((child, i, children) => visit(child, '', i === children.length - 1 ? '└── ' : '├── '));
    }
    return lines.join('\n');
  }
  show(document: SvgDocument, id: string): string {
    const shape = document.require(id);
    const parent = shape.parent === document.root ? 'svg' : shape.parent!.label;
    const attrs = Object.entries(shape.attributes).filter(([name]) => name !== 'id').map(([name, value]) => `  ${name}=${value}`);
    if (shape.textContent !== undefined) attrs.push(`  text=${JSON.stringify(shape.textContent)}`);
    return [`${shape.label}  parent=${parent}`, ...attrs].join('\n');
  }
}
