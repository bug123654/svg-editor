import { DOMParser, type Element } from '@xmldom/xmldom';
import { Group } from '../model/Group.js';
import { Guard } from '../model/Guard.js';
import { Shape } from '../model/Shape.js';
import { ShapeFactory } from '../model/ShapeFactory.js';
import { SvgDocument } from '../model/SvgDocument.js';
import { TextShape } from '../model/TextShape.js';
import { XmlWriter } from './XmlWriter.js';

export class SvgCodec {
  readonly #factory = new ShapeFactory();
  readonly #namespace = 'http://www.w3.org/2000/svg';
  readonly #presentation = new Set(['font-size', 'font-family', 'font-weight', 'text-anchor', 'dominant-baseline', 'opacity', 'fill-opacity', 'stroke-opacity', 'data-kind']);

  encode(document: SvgDocument): string {
    const writer = new XmlWriter();
    const { id: _id, ...rootAppearance } = document.root.attributes;
    writer.open('svg', { xmlns: this.#namespace, width: String(document.width), height: String(document.height), viewBox: `0 0 ${document.width} ${document.height}`, ...rootAppearance });
    for (const shape of document.root.children) shape.writeTo(writer);
    writer.close('svg'); return writer.finish();
  }

  decode(source: string): { document: SvgDocument; warnings: readonly string[] } {
    Guard.xml(source);
    if (/<!DOCTYPE|<!ENTITY/i.test(source)) throw new Error('DOCTYPE and entity declarations are not supported');
    const xml = new DOMParser({ onError: (_level, message) => { throw new Error(`invalid SVG: ${message}`); } }).parseFromString(source, 'image/svg+xml');
    const root = xml.documentElement;
    if (!root || root.localName !== 'svg' || (root.namespaceURI && root.namespaceURI !== this.#namespace)) throw new Error('expected an SVG root element');
    const document = new SvgDocument(this.dimension(root, 'width'), this.dimension(root, 'height'));
    const viewBox = root.getAttribute('viewBox');
    if (viewBox) {
      const values = viewBox.trim().split(/[\s,]+/).map(value => Guard.number(value, 'viewBox'));
      if (values.length !== 4 || values[0] !== 0 || values[1] !== 0 || values[2] !== document.width || values[3] !== document.height) {
        throw new Error('unsupported viewBox: expected 0 0 width height');
      }
    }
    const reserved = new Set<string>();
    const collect = (element: Element): void => {
      if (element !== root) {
        const id = element.getAttribute('id');
        if (id !== null) {
          Guard.id(id);
          if (reserved.has(id)) throw new Error(`id already exists: ${id}`);
          reserved.add(id);
        }
      }
      for (const child of this.elements(element)) collect(child);
    };
    collect(root);
    const warnings: string[] = [];
    const counters = new Map<string, number>();
    const read = (element: Element): Shape => {
      if (element.namespaceURI && element.namespaceURI !== this.#namespace) throw new Error('foreign XML namespace is not supported');
      const type = element.localName ?? element.tagName;
      const explicitId = element.getAttribute('id');
      let id = explicitId ?? '';
      if (explicitId === null) {
        let number = counters.get(type) ?? 0;
        do { id = `${type}${++number}`; } while (reserved.has(id));
        counters.set(type, number); reserved.add(id);
        warnings.push(`warning: assigned id ${id} to unnamed <${type}>`);
      }
      const shape = this.#factory.create(type, id);
      this.readAttributes(element, shape, new Set(['id']));
      const children = this.elements(element);
      if (shape instanceof Group) {
        this.assertWhitespace(element);
        for (const child of children) shape.insert(read(child));
      } else {
        if (children.length) throw new Error(`nested elements are not supported in <${type}>`);
        if (shape instanceof TextShape) shape.setAttribute('text', element.textContent ?? '');
        else this.assertWhitespace(element);
      }
      return shape;
    };
    this.assertWhitespace(root);
    this.readAttributes(root, document.root, new Set(['xmlns', 'width', 'height', 'viewBox', 'version']));
    for (const child of this.elements(root)) document.add(read(child));
    return { document, warnings };
  }

  private dimension(element: Element, name: string): number {
    const value = element.getAttribute(name);
    if (value === null) throw new Error(`SVG root is missing ${name}`);
    return Guard.positive(value.endsWith('px') ? value.slice(0, -2) : value, name);
  }
  private elements(element: Element): Element[] {
    const result: Element[] = [];
    for (let i = 0; i < element.childNodes.length; i++) {
      const child = element.childNodes.item(i)!;
      if (child.nodeType === 1) result.push(child as Element);
    }
    return result;
  }
  private assertWhitespace(element: Element): void {
    for (let i = 0; i < element.childNodes.length; i++) {
      const child = element.childNodes.item(i)!;
      if ((child.nodeType === 3 || child.nodeType === 4) && child.nodeValue?.trim()) throw new Error(`unexpected text in <${element.localName}>`);
    }
  }
  private readAttributes(element: Element, shape: Shape, skip: ReadonlySet<string>): void {
    for (let i = 0; i < element.attributes.length; i++) {
      const attribute = element.attributes.item(i)!;
      const name = attribute.name;
      if (skip.has(name)) continue;
      if (name === 'transform') throw new Error('SVG transform import is not supported in phase 1; use explicit coordinates');
      if (this.#presentation.has(name)) { shape.preservePresentation(name, attribute.value); continue; }
      // Geometry/style validation belongs to the polymorphic model, never a switch(tag).
      shape.setAttribute(name, attribute.value);
    }
  }
}
