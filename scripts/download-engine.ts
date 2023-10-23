import https from 'https';
import fs from 'fs';
import path from 'path';

function downloadEngine() {
  const engineDonwloadUrl = process.argv[2]
    ? process.argv[2]
    : 'https://jenkins.ivyteam.io/job/core_product/job/master/lastSuccessfulBuild/artifact/workspace/ch.ivyteam.ivy.server.product/target/products/*_Slim_*.zip/*zip*/products.zip';

  const engineDir = 'engine';
  if (fs.existsSync(engineDir)) {
    fs.rmSync(engineDir, {recursive: true, force: true});
  }
  fs.mkdirSync(engineDir);

  const filename = path.join(engineDir, path.basename(engineDonwloadUrl));

  https.get(engineDonwloadUrl, res => {
    const fileStream = fs.createWriteStream(filename);
    res.pipe(fileStream);
    fileStream.on('finish', () => {
      fileStream.close();
      console.log('Download', filename, 'finished');
      unzipEngine(filename, path.join(engineDir, 'AxonIvyEngine'));
    });
  });
}

function unzipEngine(zipName: string, targetDir: string) {
  const AdmZip = require("adm-zip");
  var zip = new AdmZip(zipName);
  zip.extractAllTo(targetDir, true, true);
  fs.rmSync(zipName);

  fs.readdir(targetDir, function (err, files) {
    files.forEach(file => {
      if(file.endsWith('.zip')) {
        const nestedZipName = path.join(targetDir, file)
        zip = new AdmZip(nestedZipName);
        zip.extractAllTo(targetDir, true, true);
        fs.rmSync(nestedZipName)
        return;
      }
    })
  });
}

downloadEngine();
