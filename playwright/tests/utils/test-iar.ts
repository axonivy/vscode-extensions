import { exec } from 'node:child_process';
import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

const iarWorkspace = path.resolve(import.meta.dirname, '../workspaces/prebuiltProject');
const iarPom = path.resolve(iarWorkspace, 'pom.xml');
const iarPath = path.resolve(iarWorkspace, 'target/prebuiltProject-1.0.0-SNAPSHOT.iar');
export const testIarCoordinates = { groupId: 'prebuiltProject', artifactId: 'prebuiltProject', version: '1.0.0-SNAPSHOT' };

export const copyTestIar = async (targetPath: string, targetFilename: string): Promise<void> => {
  if (path.extname(targetFilename) !== '.iar') {
    throw new Error(`Target filename must have .iar extension: ${targetFilename}`);
  }
  await mkdir(targetPath, { recursive: true });
  await copyFile(iarPath, path.resolve(targetPath, targetFilename));
};

const execAsync = promisify(exec);

export const installTestIar = async () => {
  await execAsync(['mvn', '--quiet', 'install', `-f ${iarPom}`].join(' '));
};
