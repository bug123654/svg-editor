export interface ShapeWriter {
  open(tag: string, attributes: Readonly<Record<string, string>>): void;
  text(content: string): void;
  close(tag: string): void;
}
