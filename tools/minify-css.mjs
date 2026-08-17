import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const input = path.join(root, 'assets', 'css', 'styles.css');
const output = path.join(root, 'assets', 'css', 'styles.min.css');

let css = fs.readFileSync(input, 'utf8');

css = css
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\s+/g, ' ')
  .replace(/\s*([{}:;,>])\s*/g, '$1')
  .replace(/;}/g, '}')
  .trim();

fs.writeFileSync(output, `${css}\n`, 'utf8');
const before = fs.statSync(input).size;
const after = fs.statSync(output).size;
console.log(`CSS: ${before} -> ${after} bytes (${Math.round((1 - after / before) * 100)}% smaller)`);
