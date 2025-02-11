import * as path from 'path';
import fs from 'fs';
import { randomInt } from 'crypto';

export const animationWorkspacePath = path.resolve(__dirname, './animationProject');
export const prebuiltWorkspacePath = path.resolve(__dirname, './prebuiltProject');
export const prebuiltEmptyWorkspacePath = path.resolve(__dirname, './prebuiltEmptyProject');
export const noEngineWorkspacePath = path.resolve(__dirname, './noEngine');
export const noProjectWorkspacePath = path.resolve(__dirname, './noProject');
export const multiProjectWorkspacePath = path.resolve(__dirname, './multiProject');
export const empty = path.resolve(__dirname, './empty');
export const embeddedEngineWorkspace = path.resolve(__dirname, './embeddedEngine');

export function removeFromWorkspace(...paths: string[]) {
  if (process.env.CI) {
    return;
  }
  fs.rmSync(path.resolve(...paths), { recursive: true, force: true });
}

export function randomArtefactName() {
  return 'test' + randomInt(10_000).toString();
}
