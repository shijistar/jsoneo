import { existsSync, readFileSync, writeFileSync } from 'fs';
import packageJson from '../package.json';

const headerComment = (legacy: boolean) => `/**
 * ${packageJson.name} (${legacy ? 'ES2015' : 'ES2020'} version)
 * ${packageJson.description}
 *
 * @version: ${packageJson.version}
 * @author: ${packageJson.author}
 * @link ${packageJson.homepage}
 */`;

const filePath = './umd/jsoneo.min.js';
if (existsSync(filePath)) {
  const umdJsContent = readFileSync(filePath, 'utf8');
  writeFileSync(filePath, `${headerComment(false)}\n${umdJsContent}`);
}
