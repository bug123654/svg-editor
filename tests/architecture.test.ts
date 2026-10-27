import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, relative, resolve } from 'node:path';
import test from 'node:test';
import ts from 'typescript';

test('production modules obey documented dependencies; IO only imports the application storage port as a type', () => {
  const root = resolve('src');
  const files: string[] = [];
  const walk = (directory: string): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.name.endsWith('.ts')) files.push(path);
    }
  };
  walk(root);
  const allowed: Record<string, readonly string[]> = {
    cli: ['cli', 'application', 'commands', 'model'],
    application: ['application', 'commands', 'model'],
    commands: ['commands', 'model'],
    io: ['io', 'model', 'application'],
    model: ['model'],
  };
  for (const file of files) {
    const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    const module = relative(root, file).split(/[\\/]/)[0]!;
    const classes = source.statements.filter(ts.isClassDeclaration);
    assert.ok(classes.length <= 1, `one class per file: ${file}`);
    if (classes.length) assert.equal(classes[0]!.name!.text, basename(file, '.ts'));
    for (const statement of source.statements) {
      assert.ok(!ts.isFunctionDeclaration(statement), `top-level behavior belongs in classes: ${file}`);
      if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
      const specifier = statement.moduleSpecifier.text;
      if (!specifier.startsWith('.')) {
        if (module === 'model' || module === 'commands' || module === 'application') {
          assert.fail(`inner layer imports external dependency: ${file} -> ${specifier}`);
        }
        continue;
      }
      if (basename(file) === 'main.ts') continue;
      const dependency = relative(root, resolve(dirname(file), specifier)).split(/[\\/]/)[0]!;
      assert.ok(allowed[module]?.includes(dependency), `${module} cannot depend on ${dependency}: ${file}`);
      if (module === 'io' && dependency === 'application') {
        assert.equal(specifier, '../application/DocumentStorage.js');
        assert.equal(statement.importClause?.isTypeOnly, true);
      }
    }
  }
});
