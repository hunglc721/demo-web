import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT_DIR = path.resolve(import.meta.dirname, '..', '..');

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    const subpath = specifier.slice(2);
    const candidates = [
      path.join(ROOT_DIR, 'src', subpath),
      path.join(ROOT_DIR, 'src', subpath + '.ts'),
      path.join(ROOT_DIR, 'src', subpath + '.tsx'),
      path.join(ROOT_DIR, 'src', subpath + '.js'),
      path.join(ROOT_DIR, 'src', subpath + '.mjs'),
      path.join(ROOT_DIR, 'src', subpath, 'index.ts'),
      path.join(ROOT_DIR, 'src', subpath, 'index.tsx'),
    ];

    for (const candidate of candidates) {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return nextResolve(pathToFileURL(candidate).href, context);
      }
    }
  }

  return nextResolve(specifier, context);
}
