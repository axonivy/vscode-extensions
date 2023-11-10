import * as path from 'path';
import fs from 'fs';

export const defaultWorkspacePath = path.resolve(__dirname, './default');
export const noEngineWorkspacePath = path.resolve(__dirname, './no-engine');
export const noProjectWorkspacePath = path.resolve(__dirname, './no-project');
export const multiProjectWorkspacePath = path.resolve(__dirname, './multi-project');
export const empty = path.resolve(__dirname, './empty');

export function removeFromWorkspace(workspace: string, target: string) {
  fs.rmSync(path.resolve(workspace, target), { recursive: true, force: true });
}
