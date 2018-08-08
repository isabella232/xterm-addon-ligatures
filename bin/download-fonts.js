const fs = require('fs');
const path = require('path');
const util = require('util');

const axios = require('axios').default;
const mkdirp = require('mkdirp');
const yauzl = require('yauzl');

const urls = {
  fira: 'https://github.com/tonsky/FiraCode/raw/master/distr/otf/FiraCode-Regular.otf',
  iosevka: 'https://github.com/be5invis/Iosevka/releases/download/v1.14.3/01-iosevka-1.14.3.zip'
};

const writeFile = util.promisify(fs.writeFile);
const fontsFolder = path.join(__dirname, '../fonts');

async function download() {
  await mkdirp(fontsFolder);

  console.log('Downloading Fira Code...');
  await writeFile(
    path.join(fontsFolder, 'firaCode.otf'),
    (await axios.get(urls.fira, { responseType: 'arraybuffer' })).data
  );

  console.log('Downloading Iosevka...');
  const iosevkaContents = (await axios.get(urls.iosevka, { responseType: 'arraybuffer' })).data;
  const iosevkaZipfile = await util.promisify(yauzl.fromBuffer)(iosevkaContents);
  await new Promise((resolve, reject) => {
    iosevkaZipfile.on('entry', entry => {
      if (entry.fileName === 'ttf/iosevka-regular.ttf') {
        iosevkaZipfile.openReadStream(entry, (err, stream) => {
          if (err) {
            return reject(err);
          }

          const writeStream = fs.createWriteStream(path.join(fontsFolder, 'iosevka.ttf'));
          stream.pipe(writeStream);
          writeStream.on('close', () => resolve());
        });
      }
    });
  });

  console.log('Loaded all fonts for testing')
}

download();

process.on('unhandledRejection', e => {
  console.error(e);
  process.exit(1);
});