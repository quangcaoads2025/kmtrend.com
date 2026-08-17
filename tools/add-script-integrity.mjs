import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

function walk(dir, extension, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['.git', 'node_modules'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, extension, files);
    else if (entry.isFile() && entry.name.endsWith(extension)) files.push(full);
  }
  return files;
}

const htmlFiles = walk(root, '.html');
let updated = 0;
for (const file of htmlFiles) {
  let html = fs.readFileSync(file, 'utf8');
  const next = html.replace(/<script\b([^>]*?)\bsrc=["'](\/assets\/js\/[^"'?]+)(?:\?[^"']*)?["']([^>]*)><\/script>/gi, (tag, before, source, after) => {
    const target = path.join(root, source.replace(/^\//, ''));
    if (!fs.existsSync(target)) return tag;
    const digest = crypto.createHash('sha256').update(fs.readFileSync(target)).digest('base64');
    const cleanBefore = before.replace(/\s+integrity=["'][^"']*["']/gi, '').replace(/\s+crossorigin=["'][^"']*["']/gi, '');
    const cleanAfter = after.replace(/\s+integrity=["'][^"']*["']/gi, '').replace(/\s+crossorigin=["'][^"']*["']/gi, '');
    const srcMatch = tag.match(/\bsrc=["']([^"']+)["']/i);
    const src = srcMatch?.[1] || source;
    const beforeAttrs = `${cleanBefore} ${cleanAfter}`.replace(/\s+/g, ' ').trim();
    const deferAttr = /\bdefer(?:\s*=|\s|$)/i.test(beforeAttrs) || source.endsWith('/boot.js') ? ' defer' : '';
    const asyncAttr = /\basync(?:\s*=|\s|$)/i.test(beforeAttrs) ? ' async' : '';
    const typeMatch = beforeAttrs.match(/\btype=["'][^"']+["']/i);
    const typeAttr = typeMatch ? ` ${typeMatch[0]}` : '';
    return `<script${deferAttr}${asyncAttr}${typeAttr} src="${src}" integrity="sha256-${digest}" crossorigin="anonymous"></script>`;
  });
  if (next !== html) {
    fs.writeFileSync(file, next, 'utf8');
    updated += 1;
  }
}
console.log(`Updated SRI attributes in ${updated} HTML files.`);
