import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const hashes = new Set();
const htmlFiles = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['.git', 'node_modules'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith('.html')) htmlFiles.push(full);
  }
}
walk(root);

const scriptPattern = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = scriptPattern.exec(html))) {
    const attrs = match[1] || '';
    const body = match[2] || '';
    if (/\bsrc\s*=/i.test(attrs) || !body.trim()) continue;
    const typeMatch = attrs.match(/\btype\s*=\s*["']([^"']+)["']/i);
    const type = (typeMatch?.[1] || '').toLowerCase();
    if (type === 'application/ld+json' || type === 'application/json') continue;
    const digest = crypto.createHash('sha256').update(body, 'utf8').digest('base64');
    hashes.add(`'sha256-${digest}'`);
  }
}

const jsFiles = [];
function walkJavaScript(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkJavaScript(full);
    else if (entry.isFile() && entry.name.endsWith('.js')) jsFiles.push(full);
  }
}
walkJavaScript(path.join(root, 'assets', 'js'));
for (const file of jsFiles) {
  const content = fs.readFileSync(file);
  const digest = crypto.createHash('sha256').update(content).digest('base64');
  hashes.add(`'sha256-${digest}'`);
}

const scriptSources = [
  "'self'",
  "'strict-dynamic'",
  ...[...hashes].sort(),
  'https://www.googletagmanager.com',
  'https://www.google-analytics.com'
].join(' ');

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  `script-src ${scriptSources}`,
  "style-src 'self'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://docs.google.com https://script.google.com https://script.googleusercontent.com",
  "frame-src 'self' https://docs.google.com https://www.google.com https://www.googletagmanager.com",
  "form-action 'self' https://docs.google.com https://script.google.com",
  "manifest-src 'self'",
  "worker-src 'self'",
  "upgrade-insecure-requests",
  "require-trusted-types-for 'script'",
  "trusted-types default goog#html 'allow-duplicates'"
].join('; ');

const output = `/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: SAMEORIGIN
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(self), payment=(), usb=()
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
  Cross-Origin-Opener-Policy: same-origin
  Content-Security-Policy: ${csp}

/*.html
  Cache-Control: public, max-age=0, must-revalidate

/assets/css/*
  Cache-Control: public, max-age=31536000, immutable

/assets/js/*
  Cache-Control: public, max-age=31536000, immutable

/assets/images/*
  Cache-Control: public, max-age=86400, stale-while-revalidate=604800

/assets/catalogs/*
  Cache-Control: public, max-age=604800

/favicon.ico
  Cache-Control: public, max-age=604800

/manifest.webmanifest
  Cache-Control: public, max-age=86400
`;

fs.writeFileSync(path.join(root, '_headers'), output, 'utf8');
console.log(`Generated _headers with ${hashes.size} executable inline-script hashes.`);
