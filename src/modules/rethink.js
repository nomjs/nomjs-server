'use strict';

const Ravel = require('ravel');
const inject = Ravel.inject;
const Module = Ravel.Module;
const prelisten = Module.prelisten;

@inject('rethinkdb')
class RethinkStorage extends Module {
  constructor(r) {
    super();
    this.r = r;
  }

  createDatabase(name) {
    return new Promise((resolve, reject) => {
      this.r.dbCreate(name).run(this.conn, (err) => {
        if (err && !err.message.includes('already exists')) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  createTable(name) {
    return new Promise((resolve, reject) => {
      this.r.tableCreate(name).run(this.conn, (err) => {
        if (err && !err.message.includes('already exists')) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Creates connection and intializes database
   */
  @prelisten
  init() {
    this.r.connect({
      db: this.params.get('rethink db name'),
      host: this.params.get('rethink host'),
      port: this.params.get('rethink port')
    }, (err, conn) => {
      if (err) {
        this.log.error(err.stack);
        process.exit(1);
      } else {
        this.conn = conn;
        this.conn.once('error', (e) => {
          this.log.error(e.stack);
          process.exit(1);
        });
        this.conn.once('close', () => {
          this.log.error('Connection to RethinkDB terminated cleanly but unexpectedly.');
          process.exit(1);
        });

        this.createDatabase(this.params.get('rethink db name'))
        .then(() => {
          this.log.info(`Found or created databse ${this.params.get('rethink db name')}`);
          return this.createTable('packages');
        })
        .then(() => {
          this.log.info('Found or created packages table');
        })
        .catch((e) => {
          this.log.error(e.stack);
          process.exit(1);
        });
      }
    });
  }
}

module.exports = RethinkStorage;
