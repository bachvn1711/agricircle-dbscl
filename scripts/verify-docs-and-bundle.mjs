import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT_DIR = path.resolve(import.meta.dirname, '..');
const MAX_BUNDLE_BYTES = 1_572_864;
const CI_PATH = fs.existsSync(path.resolve(ROOT_DIR, '.github/workflows/ci.yml')) ? '.github/workflows/ci.yml' : '.ci-workflows/workflows/ci.yml';
const REQUIRED_DOCS = [
  'README.md',
  'docs/01-goals.md',
  'docs/02-requirements.md',
  'docs/03-thcs-technical-guide.md',
  CI_PATH
];
const LEAFLET_DIST_FILES = [
  'leaflet.js',
  'leaflet.css',
  'images/layers.png',
  'images/layers-2x.png',
  'images/marker-icon.png',
  'images/marker-icon-2x.png',
  'images/marker-shadow.png'
];
const SCAN_DIRS = ['src', 'public', 'scripts', 'tests'];
const SCAN_EXTENSIONS = new Set(['.js', '.mjs', '.css', '.html']);
const REGEX_AFTER_KEYWORDS = new Set([
  'return',
  'throw',
  'case',
  'delete',
  'void',
  'typeof',
  'in',
  'instanceof',
  'new',
  'yield',
  'await',
  'of',
  'else',
  'do',
  'default'
]);
const PAREN_HEADER_KEYWORDS = new Set(['if', 'while', 'for', 'with']);
const SAFE_SEGMENT_REGEX = /^[A-Za-z0-9._-]+$/;
const PRECACHE_PREFIX_RULES = [
  { prefix: '/styles/', baseSubdir: ['public', 'styles'], extensions: new Set(['.css']) },
  { prefix: '/js/', baseSubdir: ['public', 'js'], extensions: new Set(['.js']) },
  { prefix: '/icons/', baseSubdir: ['public', 'icons'], extensions: new Set(['.png', '.svg', '.ico']) },
  { prefix: '/shared/', baseSubdir: ['src', 'shared'], extensions: new Set(['.js']) }
];
const REGEX_AFTER_PUNCT = new Set([
  '(',
  '[',
  '{',
  ',',
  ';',
  ':',
  '?',
  '=',
  '!',
  '&',
  '|',
  '^',
  '~',
  '+',
  '-',
  '*',
  '/',
  '%',
  '<',
  '>'
]);

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function readUtf8Required(relPath) {
  const fullPath = path.join(ROOT_DIR, relPath);
  assertCondition(fs.existsSync(fullPath), `Missing required file: ${relPath}`);
  const stat = fs.statSync(fullPath);
  assertCondition(stat.isFile(), `Expected regular file: ${relPath}`);
  const content = fs.readFileSync(fullPath, 'utf8');
  assertCondition(content.trim().length > 0, `Required file is empty: ${relPath}`);
  return content;
}

function listFilesRecursive(absDir) {
  if (!fs.existsSync(absDir)) {
    return [];
  }
  const results = [];
  const entries = fs.readdirSync(absDir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    const fullPath = path.join(absDir, entry.name);
    if (entry.isDirectory()) {
      results.push(...listFilesRecursive(fullPath));
    } else if (entry.isFile()) {
      results.push(fullPath);
    }
  }
  return results;
}

function scanQuotedString(source, startIndex, quoteChar, startLine) {
  let i = startIndex + 1;
  let line = startLine;
  while (i < source.length) {
    const ch = source[i];
    if (ch === '\\') {
      if (i + 1 < source.length) {
        if (source[i + 1] === '\r' && source[i + 2] === '\n') {
          line += 1;
          i += 3;
          continue;
        }
        if (source[i + 1] === '\n' || source[i + 1] === '\r') {
          line += 1;
        }
        i += 2;
        continue;
      }
      i += 1;
      break;
    }
    if (ch === '\n') {
      line += 1;
    }
    if (ch === quoteChar) {
      return { nextIndex: i + 1, line };
    }
    i += 1;
  }
  return { nextIndex: i, line };
}

function scanRegexLiteral(source, startIndex, startLine) {
  let i = startIndex + 1;
  let inClass = false;
  while (i < source.length) {
    const ch = source[i];
    if (ch === '\\') {
      i += i + 1 < source.length ? 2 : 1;
      continue;
    }
    if (ch === '\n' || ch === '\r') {
      break;
    }
    if (ch === '[') {
      inClass = true;
      i += 1;
      continue;
    }
    if (ch === ']' && inClass) {
      inClass = false;
      i += 1;
      continue;
    }
    if (ch === '/' && !inClass) {
      i += 1;
      while (i < source.length && /[A-Za-z]/.test(source[i])) {
        i += 1;
      }
      return { nextIndex: i, line: startLine };
    }
    i += 1;
  }
  return { nextIndex: i, line: startLine };
}

export function scanJsComments(source) {
  const findings = [];
  const templateStack = [];
  const parenStack = [];
  let i = 0;
  let line = 1;
  let canStartRegex = true;
  let prevWasDot = false;
  let pendingHeaderParen = false;

  function scanTemplateBody() {
    while (i < source.length) {
      const ch = source[i];
      if (ch === '\\') {
        if (source[i + 1] === '\r' && source[i + 2] === '\n') {
          line += 1;
          i += 3;
          continue;
        }
        if (source[i + 1] === '\n' || source[i + 1] === '\r') {
          line += 1;
        }
        i += 2;
        continue;
      }
      if (ch === '\n') {
        line += 1;
      }
      if (ch === '`') {
        i += 1;
        canStartRegex = false;
        prevWasDot = false;
        pendingHeaderParen = false;
        return;
      }
      if (ch === '$' && source[i + 1] === '{') {
        i += 2;
        templateStack.push({ braceDepth: 1 });
        canStartRegex = true;
        prevWasDot = false;
        pendingHeaderParen = false;
        return;
      }
      i += 1;
    }
  }

  while (i < source.length) {
    const ch = source[i];

    if (ch === ' ' || ch === '\t' || ch === '\v' || ch === '\f' || ch === '\r') {
      i += 1;
      continue;
    }
    if (ch === '\n') {
      line += 1;
      i += 1;
      continue;
    }

    if (ch === "'" || ch === '"') {
      const res = scanQuotedString(source, i, ch, line);
      i = res.nextIndex;
      line = res.line;
      canStartRegex = false;
      prevWasDot = false;
      pendingHeaderParen = false;
      continue;
    }

    if (ch === '`') {
      i += 1;
      scanTemplateBody();
      continue;
    }

    if (ch === '/') {
      const next = source[i + 1];
      if (next === '/') {
        findings.push({ line, kind: '//' });
        i += 2;
        while (i < source.length && source[i] !== '\n') {
          i += 1;
        }
        pendingHeaderParen = false;
        continue;
      }
      if (next === '*') {
        findings.push({ line, kind: '/* */' });
        i += 2;
        while (i < source.length) {
          if (source[i] === '\n') {
            line += 1;
          }
          if (source[i] === '*' && source[i + 1] === '/') {
            i += 2;
            break;
          }
          i += 1;
        }
        continue;
      }
      if (canStartRegex) {
        const res = scanRegexLiteral(source, i, line);
        i = res.nextIndex;
        line = res.line;
        canStartRegex = false;
        prevWasDot = false;
        pendingHeaderParen = false;
        continue;
      }
      i += 1;
      if (source[i] === '=') {
        i += 1;
      }
      canStartRegex = true;
      prevWasDot = false;
      pendingHeaderParen = false;
      continue;
    }

    if (ch === '{') {
      if (templateStack.length > 0) {
        templateStack[templateStack.length - 1].braceDepth += 1;
      }
      i += 1;
      canStartRegex = true;
      prevWasDot = false;
      pendingHeaderParen = false;
      continue;
    }

    if (ch === '}') {
      if (templateStack.length > 0) {
        const top = templateStack[templateStack.length - 1];
        top.braceDepth -= 1;
        if (top.braceDepth === 0) {
          templateStack.pop();
          i += 1;
          scanTemplateBody();
          continue;
        }
      }
      i += 1;
      canStartRegex = true;
      prevWasDot = false;
      pendingHeaderParen = false;
      continue;
    }

    if ((ch === '+' && source[i + 1] === '+') || (ch === '-' && source[i + 1] === '-')) {
      i += 2;
      canStartRegex = false;
      prevWasDot = false;
      pendingHeaderParen = false;
      continue;
    }

    if (ch === '.') {
      if (/\d/.test(source[i + 1] || '')) {
        i += 1;
        while (i < source.length && /[\d_eE.]/.test(source[i])) {
          if ((source[i] === 'e' || source[i] === 'E') && (source[i + 1] === '+' || source[i + 1] === '-')) {
            i += 2;
            continue;
          }
          i += 1;
        }
        canStartRegex = false;
        prevWasDot = false;
        pendingHeaderParen = false;
        continue;
      }
      if (source[i + 1] === '.' && source[i + 2] === '.') {
        i += 3;
        canStartRegex = true;
        prevWasDot = false;
        pendingHeaderParen = false;
        continue;
      }
      i += 1;
      canStartRegex = false;
      prevWasDot = true;
      pendingHeaderParen = false;
      continue;
    }

    if (/\d/.test(ch)) {
      const isPrefixedBase = ch === '0' && /[xXbBoO]/.test(source[i + 1] || '');
      while (i < source.length && /[\dA-Za-z_.]/.test(source[i])) {
        if (!isPrefixedBase && (source[i] === 'e' || source[i] === 'E') && (source[i + 1] === '+' || source[i + 1] === '-')) {
          i += 2;
          continue;
        }
        i += 1;
      }
      canStartRegex = false;
      prevWasDot = false;
      pendingHeaderParen = false;
      continue;
    }

    if (/[\p{L}_$]/u.test(ch)) {
      const start = i;
      while (i < source.length && /[\p{L}\p{N}_$]/u.test(source[i])) {
        i += 1;
      }
      const word = source.slice(start, i);
      const isKeyword = !prevWasDot;
      canStartRegex = isKeyword && REGEX_AFTER_KEYWORDS.has(word);
      if (isKeyword && PAREN_HEADER_KEYWORDS.has(word)) {
        pendingHeaderParen = true;
      } else if (!(pendingHeaderParen && isKeyword && word === 'await')) {
        pendingHeaderParen = false;
      }
      prevWasDot = false;
      continue;
    }

    if (ch === '(') {
      parenStack.push(pendingHeaderParen);
      i += 1;
      canStartRegex = true;
      prevWasDot = false;
      pendingHeaderParen = false;
      continue;
    }

    if (ch === ')') {
      const closesHeaderParen = parenStack.length > 0 ? parenStack.pop() : false;
      i += 1;
      canStartRegex = closesHeaderParen;
      prevWasDot = false;
      pendingHeaderParen = false;
      continue;
    }

    if (ch === ']') {
      i += 1;
      canStartRegex = false;
      prevWasDot = false;
      pendingHeaderParen = false;
      continue;
    }

    if (REGEX_AFTER_PUNCT.has(ch)) {
      i += 1;
      canStartRegex = true;
      prevWasDot = false;
      pendingHeaderParen = false;
      continue;
    }

    i += 1;
    prevWasDot = false;
    pendingHeaderParen = false;
  }

  return findings;
}

export function scanCssComments(source) {
  const findings = [];
  let i = 0;
  let line = 1;

  while (i < source.length) {
    const ch = source[i];
    if (ch === '\n') {
      line += 1;
      i += 1;
      continue;
    }
    if (ch === "'" || ch === '"') {
      const res = scanQuotedString(source, i, ch, line);
      i = res.nextIndex;
      line = res.line;
      continue;
    }
    if (ch === '/' && source[i + 1] === '*') {
      findings.push({ line, kind: '/* */' });
      i += 2;
      while (i < source.length) {
        if (source[i] === '\n') {
          line += 1;
        }
        if (source[i] === '*' && source[i + 1] === '/') {
          i += 2;
          break;
        }
        i += 1;
      }
      continue;
    }
    const prevChar = i > 0 ? source[i - 1] : '';
    const isUrlStartBoundary = !/[A-Za-z0-9_-]/.test(prevChar);
    if (isUrlStartBoundary && source.slice(i, i + 4).toLowerCase() === 'url(') {
      let j = i + 4;
      while (j < source.length) {
        while (j < source.length && /\s/.test(source[j])) {
          if (source[j] === '\n') {
            line += 1;
          }
          j += 1;
        }
        if (source[j] === '/' && source[j + 1] === '*') {
          findings.push({ line, kind: '/* */' });
          j += 2;
          while (j < source.length) {
            if (source[j] === '\n') {
              line += 1;
            }
            if (source[j] === '*' && source[j + 1] === '/') {
              j += 2;
              break;
            }
            j += 1;
          }
          continue;
        }
        break;
      }
      if (source[j] === "'" || source[j] === '"') {
        i = j;
        continue;
      }
      while (j < source.length && source[j] !== ')') {
        if (source[j] === '\\' && j + 1 < source.length) {
          j += 2;
          continue;
        }
        if (source[j] === '\n') {
          line += 1;
        }
        j += 1;
      }
      i = j < source.length ? j + 1 : j;
      continue;
    }
    i += 1;
  }

  return findings;
}

function scanHtmlQuotedAttr(source, startIndex, quoteChar, startLine) {
  let i = startIndex + 1;
  let line = startLine;
  while (i < source.length) {
    const ch = source[i];
    if (ch === '\n') {
      line += 1;
    }
    if (ch === quoteChar) {
      return { nextIndex: i + 1, line };
    }
    i += 1;
  }
  return { nextIndex: i, line };
}

function findRawTextCloseTagOffset(source, startIndex, tagName) {
  const closeRegex = new RegExp(`<\\/${tagName}(?=[\\s/>]|$)`, 'gi');
  closeRegex.lastIndex = startIndex;
  const match = closeRegex.exec(source);
  return match ? match.index : source.length;
}

export function scanHtmlComments(source) {
  const findings = [];
  let i = 0;
  let line = 1;

  while (i < source.length) {
    if (source.startsWith('<!--', i)) {
      findings.push({ line, kind: '<!-- -->' });
      const endIdx = source.indexOf('-->', i + 4);
      const stop = endIdx >= 0 ? endIdx + 3 : source.length;
      for (let k = i; k < stop; k += 1) {
        if (source[k] === '\n') {
          line += 1;
        }
      }
      i = stop;
      continue;
    }
    if (source[i] === '<' && /[A-Za-z!]/.test(source[i + 1] || '')) {
      const tagNameMatch = /^<([A-Za-z0-9-]+)/.exec(source.slice(i));
      const tagName = tagNameMatch ? tagNameMatch[1].toLowerCase() : '';
      i += 1;
      while (i < source.length && source[i] !== '>') {
        if (source[i] === '\n') {
          line += 1;
          i += 1;
          continue;
        }
        if (source[i] === "'" || source[i] === '"') {
          const res = scanHtmlQuotedAttr(source, i, source[i], line);
          i = res.nextIndex;
          line = res.line;
          continue;
        }
        i += 1;
      }
      if (source[i] === '>') {
        i += 1;
      }
      if (tagName === 'script' || tagName === 'style') {
        const bodyEnd = findRawTextCloseTagOffset(source, i, tagName);
        const inner = source.slice(i, bodyEnd);
        const innerFindings = tagName === 'script' ? scanJsComments(inner) : scanCssComments(inner);
        for (const item of innerFindings) {
          findings.push({ line: line + item.line - 1, kind: item.kind });
        }
        for (let k = i; k < bodyEnd; k += 1) {
          if (source[k] === '\n') {
            line += 1;
          }
        }
        i = bodyEnd;
      }
      continue;
    }
    if (source[i] === '\n') {
      line += 1;
    }
    i += 1;
  }

  return findings;
}

function scanFileComments(absPath) {
  const ext = path.extname(absPath).toLowerCase();
  const content = fs.readFileSync(absPath, 'utf8');
  if (ext === '.js' || ext === '.mjs') {
    return scanJsComments(content);
  }
  if (ext === '.css') {
    return scanCssComments(content);
  }
  if (ext === '.html') {
    return scanHtmlComments(content);
  }
  return [];
}

function verifyPackageAndConfig() {
  const pkgRaw = readUtf8Required('package.json');
  const pkg = JSON.parse(pkgRaw);
  assertCondition(pkg.type === 'module', 'package.json must set "type": "module"');
  assertCondition(pkg.dependencies && pkg.dependencies.leaflet === '1.9.4', 'package.json must pin "leaflet": "1.9.4"');

  const lockRaw = readUtf8Required('package-lock.json');
  const lock = JSON.parse(lockRaw);
  const lockedLeaflet = lock.packages && lock.packages['node_modules/leaflet'];
  assertCondition(lockedLeaflet && lockedLeaflet.version === '1.9.4', 'package-lock.json must lock leaflet@1.9.4');

  const envExample = readUtf8Required('.env.example');
  assertCondition(/^PORT=/m.test(envExample), '.env.example must declare PORT=');
  assertCondition(/^HOST=/m.test(envExample), '.env.example must declare HOST=');
  assertCondition(/^DB_PATH=/m.test(envExample), '.env.example must declare DB_PATH=');
  assertCondition(/^ADMIN_PIN=\s*$/m.test(envExample), '.env.example must leave ADMIN_PIN empty');

  const gitignore = readUtf8Required('.gitignore');
  const gitignoreLines = new Set(gitignore.split(/\r?\n/).map((line) => line.trim()));
  assertCondition(gitignoreLines.has('.env'), '.gitignore must ignore .env');
  assertCondition(
    gitignoreLines.has('data/') && (gitignoreLines.has('*.sqlite') || gitignoreLines.has('data/*.db')),
    '.gitignore must ignore data/ and sqlite/db files'
  );
}

function verifyDocsAndWorkflow() {
  for (const relPath of REQUIRED_DOCS) {
    readUtf8Required(relPath);
  }

  const ciContent = readUtf8Required(CI_PATH);
  assertCondition(/permissions:\s*\r?\n\s*contents:\s*read\b/.test(ciContent), 'ci.yml must set minimal contents: read permissions');
  assertCondition(/timeout-minutes:\s*\d+/.test(ciContent), 'ci.yml must specify timeout-minutes');
  assertCondition(/node-version:\s*['"]?26['"]?/.test(ciContent), 'ci.yml must use Node 26');

  const usesMatches = Array.from(ciContent.matchAll(/uses:\s*([^\s#]+)/g));
  assertCondition(usesMatches.length >= 2, 'ci.yml must define checkout and setup-node steps');
  for (const match of usesMatches) {
    assertCondition(
      /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+@[0-9a-f]{40}$/.test(match[1]),
      `ci.yml action must be pinned to a 40-char commit SHA: ${match[1]}`
    );
  }

  const testFiles = listFilesRecursive(path.join(ROOT_DIR, 'tests')).filter((f) => f.endsWith('.test.js'));
  assertCondition(testFiles.length > 0, 'No test files found in tests/');
  for (const testFile of testFiles) {
    const rel = path.relative(ROOT_DIR, testFile).replace(/\\/g, '/');
    assertCondition(ciContent.includes(rel), `ci.yml must run test file: ${rel}`);
  }
  assertCondition(ciContent.includes('scripts/verify-docs-and-bundle.mjs'), 'ci.yml must run scripts/verify-docs-and-bundle.mjs');

  const reqDoc = readUtf8Required('docs/02-requirements.md');
  for (const marker of ['shortCode', 'no-comments', '03-thcs-technical-guide.md', 'hidden', 'activeListings', 'R14']) {
    assertCondition(reqDoc.includes(marker), `docs/02-requirements.md missing required alignment marker: ${marker}`);
  }

  const guideDoc = readUtf8Required('docs/03-thcs-technical-guide.md');
  for (const marker of ['BigInt', 'convertToKg', 'haversineKm', 'parseVoiceInput', '1.46']) {
    assertCondition(guideDoc.includes(marker), `docs/03-thcs-technical-guide.md missing required technical topic: ${marker}`);
  }
}

function verifyZeroComments() {
  let scannedCount = 0;
  for (const dirName of SCAN_DIRS) {
    const files = listFilesRecursive(path.join(ROOT_DIR, dirName));
    for (const filePath of files) {
      const ext = path.extname(filePath).toLowerCase();
      if (!SCAN_EXTENSIONS.has(ext)) {
        continue;
      }
      scannedCount += 1;
      const findings = scanFileComments(filePath);
      if (findings.length > 0) {
        const rel = path.relative(ROOT_DIR, filePath).replace(/\\/g, '/');
        const first = findings[0];
        throw new Error(`Code comment found in ${rel}:${first.line} (${first.kind})`);
      }
    }
  }
  assertCondition(scannedCount > 0, 'No source files scanned for no-comments check');
  return scannedCount;
}

function resolvePrecacheAsset(assetUrl) {
  assertCondition(typeof assetUrl === 'string' && assetUrl.startsWith('/'), `Invalid PRECACHE_URLS entry: ${assetUrl}`);
  assertCondition(!assetUrl.includes('..') && !assetUrl.includes('\\') && !assetUrl.includes('?') && !assetUrl.includes('#'), `Unsafe PRECACHE_URLS entry: ${assetUrl}`);
  if (assetUrl === '/') {
    return path.join(ROOT_DIR, 'public', 'index.html');
  }
  if (assetUrl === '/api/crops') {
    return null;
  }
  if (assetUrl === '/manifest.webmanifest') {
    return path.join(ROOT_DIR, 'public', 'manifest.webmanifest');
  }
  for (const rule of PRECACHE_PREFIX_RULES) {
    if (assetUrl.startsWith(rule.prefix)) {
      const segment = assetUrl.slice(rule.prefix.length);
      assertCondition(
        SAFE_SEGMENT_REGEX.test(segment) && !segment.includes('..'),
        `PRECACHE_URLS has invalid asset segment: ${assetUrl}`
      );
      const ext = path.extname(segment).toLowerCase();
      assertCondition(
        rule.extensions.has(ext),
        `PRECACHE_URLS references disallowed extension for ${rule.prefix}: ${assetUrl}`
      );
      return path.join(ROOT_DIR, ...rule.baseSubdir, segment);
    }
  }
  if (assetUrl.startsWith('/vendor/leaflet/')) {
    const relLeaflet = assetUrl.slice('/vendor/leaflet/'.length);
    assertCondition(LEAFLET_DIST_FILES.includes(relLeaflet), `PRECACHE_URLS references unexposed Leaflet asset: ${assetUrl}`);
    return path.join(ROOT_DIR, 'node_modules', 'leaflet', 'dist', relLeaflet);
  }
  throw new Error(`PRECACHE_URLS references unserved route: ${assetUrl}`);
}

async function verifyBundleAndPrecache() {
  const publicFiles = listFilesRecursive(path.join(ROOT_DIR, 'public'));
  assertCondition(publicFiles.length > 0, 'public/ has no files');

  const sharedFiles = listFilesRecursive(path.join(ROOT_DIR, 'src', 'shared')).filter((f) => f.endsWith('.js'));
  assertCondition(sharedFiles.length > 0, 'src/shared/ has no .js files');

  const leafletFiles = LEAFLET_DIST_FILES.map((rel) => path.join(ROOT_DIR, 'node_modules', 'leaflet', 'dist', rel));
  for (const filePath of leafletFiles) {
    assertCondition(fs.existsSync(filePath) && fs.statSync(filePath).isFile(), `Missing Leaflet runtime asset: ${filePath}`);
  }

  const swRoutesUrl = pathToFileURL(path.join(ROOT_DIR, 'public', 'js', 'sw-routes.js')).href;
  const swRoutesMod = await import(swRoutesUrl);
  assertCondition(Array.isArray(swRoutesMod.PRECACHE_URLS) && swRoutesMod.PRECACHE_URLS.length > 0, 'PRECACHE_URLS must be a non-empty array');

  for (const entry of swRoutesMod.PRECACHE_URLS) {
    const resolved = resolvePrecacheAsset(entry);
    if (resolved !== null) {
      assertCondition(fs.existsSync(resolved) && fs.statSync(resolved).isFile(), `PRECACHE_URLS target missing on disk: ${entry}`);
    }
  }

  let publicBytes = 0;
  for (const f of publicFiles) {
    publicBytes += fs.statSync(f).size;
  }

  let sharedBytes = 0;
  for (const f of sharedFiles) {
    sharedBytes += fs.statSync(f).size;
  }

  let leafletBytes = 0;
  for (const f of leafletFiles) {
    leafletBytes += fs.statSync(f).size;
  }

  const totalBytes = publicBytes + sharedBytes + leafletBytes;
  assertCondition(totalBytes < MAX_BUNDLE_BYTES, `Client bundle ${totalBytes} bytes exceeds limit ${MAX_BUNDLE_BYTES}`);

  return {
    publicFiles: publicFiles.length,
    publicBytes,
    sharedFiles: sharedFiles.length,
    sharedBytes,
    leafletFiles: leafletFiles.length,
    leafletBytes,
    totalBytes,
    precacheCount: swRoutesMod.PRECACHE_URLS.length
  };
}

async function main() {
  verifyPackageAndConfig();
  verifyDocsAndWorkflow();
  const scannedFiles = verifyZeroComments();
  const bundle = await verifyBundleAndPrecache();

  process.stdout.write(`Scanned files (zero comments): ${scannedFiles}\n`);
  process.stdout.write(`Precache entries verified: ${bundle.precacheCount}\n`);
  process.stdout.write(
    `Client bundle bytes: ${bundle.totalBytes} / ${MAX_BUNDLE_BYTES} (public: ${bundle.publicBytes} across ${bundle.publicFiles} files, shared: ${bundle.sharedBytes} across ${bundle.sharedFiles} files, leaflet: ${bundle.leafletBytes} across ${bundle.leafletFiles} files)\n`
  );
  process.stdout.write('VERIFY_OK\n');
}

function isMainModule() {
  if (!process.argv[1]) {
    return false;
  }
  try {
    const argPath = fs.realpathSync(path.resolve(process.argv[1]));
    const selfPath = fs.realpathSync(import.meta.filename);
    if (process.platform === 'win32') {
      return argPath.toLowerCase() === selfPath.toLowerCase();
    }
    return argPath === selfPath;
  } catch {
    return false;
  }
}

if (isMainModule()) {
  main().catch((err) => {
    process.stderr.write(`VERIFY_FAILED: ${err instanceof Error ? err.message : String(err)}\n`);
    process.exitCode = 1;
  });
}
