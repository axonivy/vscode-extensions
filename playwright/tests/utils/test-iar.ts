import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const iarPath = path.resolve(import.meta.dirname, '../workspaces/prebuiltProject/target/prebuiltProject-1.0.0-SNAPSHOT.iar');

export const copyTestIar = async (targetPath: string, targetFilename: string): Promise<void> => {
  if (path.extname(targetFilename) !== '.iar') {
    throw new Error(`Target filename must have .iar extension: ${targetFilename}`);
  }
  await mkdir(targetPath, { recursive: true });
  await copyFile(iarPath, path.resolve(targetPath, targetFilename));
};
