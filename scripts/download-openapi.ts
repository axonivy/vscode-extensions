import fs from 'fs';
const { Readable } = require('stream');
import { finished } from 'stream/promises';

const downloadOpenapi = async () => {
  const url = process.argv[2] ? new URL(process.argv[2]) : new URL('https://neo.demo.ivyteam.io');
  await download('openapi-default.yaml', new URL('api/openapi.yaml', url));
  await download('openapi-dev.yaml', new URL('ivy-dev-workflow-demos/api/openapi.yaml', url));
};

const download = async (fileName: string, url: URL) => {
  const stream = fs.createWriteStream(fileName);
  const { body } = await fetch(url);
  await finished(Readable.fromWeb(body).pipe(stream));
};

downloadOpenapi();
