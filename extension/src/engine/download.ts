import { Readable } from 'node:stream';
import type { ReadableStream } from 'node:stream/web';
import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';

export const downloadEngine = async (url: string, engineDir: string) => {
  if (fs.existsSync(engineDir)) {
    console.log(`Engine does already exist under '${engineDir}'`);
    return;
  }
  fs.mkdirSync(engineDir, { recursive: true });
  await downloadEngineReq(engineDir, url);
};

const downloadEngineReq = (engineDir: string, downloadUrl: string) => {
  const filename = path.join(engineDir, path.basename(downloadUrl));
  console.log(`Download engine from '${downloadUrl}' to '${filename}'`);

  const requestInit: RequestInit = {};
  return new Promise<void>((resolve, reject) => {
    fetch(downloadUrl, requestInit).then(response => {
      if (!response.ok) {
        return reject(`Download engine failed with status code ${response.status}`);
      }
      const fileStream = fs.createWriteStream(filename);
      Readable.fromWeb(response.body as ReadableStream<Uint8Array>).pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        console.log('--> Download finished');
        unzipEngine(filename, engineDir);
        return resolve();
      });
    });
  });
};

const unzipEngine = (zipName: string, targetDir: string) => {
  console.log(`Extract '${zipName}' to '${targetDir}'`);
  let zip = new AdmZip(zipName);
  zip.extractAllTo(targetDir, true, true);
  fs.rmSync(zipName);

  const files = fs.readdirSync(targetDir);
  files.forEach(file => {
    const nestedZipName = path.join(targetDir, file);
    if (nestedZipName.endsWith('.zip') && fs.existsSync(nestedZipName)) {
      zip = new AdmZip(nestedZipName);
      zip.extractAllTo(targetDir, true, true);
      fs.rmSync(nestedZipName);
      return;
    }
  });
  console.log('--> Extract finished');
};
