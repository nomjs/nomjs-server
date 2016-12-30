const spawn = require('child_process').spawn;

describe('Test `npm auth` commands', () => {
  let nom;

  before('setup nom before all tests', () => {
    console.info('Firing up nom...');
    console.info(`Nom is: ${typeof nom}`);
    nom = require('../../dist/app.js');

    return new Promise((resolve) => {
      nom.start().then(() => {
        console.info('Nom up and running.');
        resolve();
      });
    });
  });

  it('validate that we can call adduser', () => {
    console.info('Running \'npm adduser\'');

    return new Promise((resolve, reject) => {
      const npm = spawn('npm', ['--loglevel', 'verbose', '--registry', 'http://localhost:9080', 'adduser'], {silent: false});
      npm.stdout.on('data', (data) => {
        if (data.includes('Username:')) {
          console.log('Sending username.');
          npm.stdin.write('nomjs-bot\n');
        } else if (data.includes('Password:')) {
          console.log('Sending password.');
          npm.stdin.write('bo7bo7bo7bo7bo7\n');
        } else if (data.includes('Email:')) {
          console.log('Sending email address.');
          npm.stdin.write('bot@nomjs.com\n');
        }
      });

      npm.stderr.on('data', (data) => {
        if (data.includes('exit [ 1, true ]')) {
          npm.kill('SIGKILL');
          reject(new Error('npm threw an error.'));
        } else if (data.includes('exit [ 0, true ]')) {
          npm.kill('SIGKILL');
          resolve();
        }
      });
      resolve();
    });
  });

  after('cleanup nom after all tests', () => {
    console.info('Shutting down nom...');
    return new Promise((resolve) => {
      if (nom) {
        nom.close().then(() => {
          console.info('Nom shutdown.');
          nom = undefined;
          resolve();
        });
      } else {
        console.info('No nom running, terminating.');
        nom = undefined;
        resolve();
      }
    });
  });
});
