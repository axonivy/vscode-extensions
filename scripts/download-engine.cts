const https = require('https');
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

function downloadEngine() {
  const engineDonwloadUrl = process.argv[2]
    ? process.argv[2]
    : 'https://jenkins.ivyteam.io/job/core_product-engine/job/master/lastSuccessfulBuild/artifact/workspace/ch.ivyteam.ivy.server.product/target/products/*_Slim_*.zip/*zip*/products.zip';

  const engineDir = 'extension/AxonIvyEngine';
  if (fs.existsSync(engineDir)) {
    fs.rmSync(engineDir, { recursive: true, force: true });
  }
  fs.mkdirSync(engineDir);
  downloadEngineReq(engineDir, engineDonwloadUrl);
}

function downloadEngineReq(engineDir: string, downloadUrl: string) {
  const filename = path.join(engineDir, path.basename(downloadUrl));
  https.get(downloadUrl, res => {
    if (res.statusCode === 302 && res.headers.location) {
      downloadEngineReq(engineDir, res.headers.location);
      return;
    }
    const fileStream = fs.createWriteStream(filename);
    res.pipe(fileStream);
    fileStream.on('finish', () => {
      fileStream.close();
      console.log('Download', filename, 'finished');
      unzipEngine(filename, engineDir);
    });
  });
}

function unzipEngine(zipName: string, targetDir: string) {
  var zip = new AdmZip(zipName);
  zip.extractAllTo(targetDir, true, true);
  fs.rmSync(zipName);

  fs.readdir(targetDir, function (err, files) {
    files.forEach(file => {
      const nestedZipName = path.join(targetDir, file);
      if (nestedZipName.endsWith('.zip') && fs.existsSync(nestedZipName)) {
        zip = new AdmZip(nestedZipName);
        zip.extractAllTo(targetDir, true, true);
        fs.rmSync(nestedZipName);
        return;
      }
    });
  });
}

downloadEngine();
