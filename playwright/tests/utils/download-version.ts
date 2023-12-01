import { DownloadVersion } from '@vscode/test-electron/out/download';

export const downloadVersion: DownloadVersion = process.env.CI || process.env.RUN_STABLE_VERSION ? 'stable' : 'insiders';
