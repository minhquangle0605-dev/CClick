import ts from 'typescript';
import { relative, resolve, sep } from 'node:path';

const root = resolve('src');
const configFile = ts.readConfigFile('tsconfig.json', ts.sys.readFile);
const config = ts.parseJsonConfigFileContent(configFile.config, ts.sys, process.cwd());
const files = config.fileNames
  .map((file) => resolve(file))
  .filter((file) => file.startsWith(root + sep) && /\.tsx?$/.test(file));
if (!files.length) throw new Error('Không tìm thấy file nguồn để kiểm tra kiến trúc.');
const allowed: Record<string, readonly string[]> = {
  app: ['app', 'core', 'content', 'platform', 'features', 'ui', 'shared', 'assets', 'locales'],
  core: ['core', 'shared'],
  content: ['content', 'core', 'shared'],
  features: ['features', 'core', 'ui', 'shared', 'assets', 'locales'],
  platform: ['platform', 'core', 'shared'],
  ui: ['ui', 'shared', 'assets', 'locales'],
  shared: ['shared'],
  assets: ['assets'],
  locales: ['locales'],
};
const graph = new Map<string, string[]>();
const errors: string[] = [];
const layer = (file: string) => relative(root, file).split(sep)[0]!;
for (const file of files) {
  const from = layer(file);
  if (!allowed[from] && file !== resolve(root, 'main.tsx')) {
    errors.push(`${relative(root, file)}: file nguồn phải thuộc một tầng đã khai báo`);
  }
  const source = ts.createSourceFile(
    file,
    ts.sys.readFile(file) ?? '',
    ts.ScriptTarget.Latest,
    true,
  );
  const edges: string[] = [];
  function scan(node: ts.Node): void {
    let specifier: string | undefined;
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      specifier = node.moduleSpecifier.text;
    } else if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments[0] &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      specifier = node.arguments[0].text;
    }
    if (specifier) {
      if (
        from === 'core' &&
        !specifier.startsWith('.') &&
        !specifier.startsWith('@core/') &&
        !specifier.startsWith('@shared/')
      ) {
        errors.push(`${relative(root, file)}: core không được import ${specifier}`);
      }
      const target = ts.resolveModuleName(specifier, file, config.options, ts.sys).resolvedModule;
      if (target && resolve(target.resolvedFileName).startsWith(root + sep)) {
        const destination = resolve(target.resolvedFileName);
        const to = layer(destination);
        edges.push(destination);
        if (allowed[from] && !allowed[from]!.includes(to)) {
          errors.push(`${relative(root, file)}: ${from} -> ${to} không được phép`);
        }
      }
    }
    ts.forEachChild(node, scan);
  }
  scan(source);
  graph.set(file, edges);
}
const visited = new Set<string>();
const active = new Set<string>();
function visit(file: string, chain: string[]): void {
  if (active.has(file)) {
    errors.push(
      `Import vòng: ${[...chain, file].map((path) => relative(root, path)).join(' -> ')}`,
    );
    return;
  }
  if (visited.has(file)) return;
  active.add(file);
  for (const next of graph.get(file) ?? []) visit(next, [...chain, file]);
  active.delete(file);
  visited.add(file);
}
for (const file of files) visit(file, []);
if (errors.length) throw new Error(errors.join('\n'));
console.log(`Kiến trúc hợp lệ: ${files.length} file, không import sai tầng hoặc import vòng.`);
