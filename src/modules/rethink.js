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

  createTable(name, pkey) {
    return new Promise((resolve, reject) => {
      this.r.tableCreate(name, {
        primaryKey: pkey ? pkey : 'id'
      }).run(this.conn, (err) => {
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
          return this.createTable('packages', 'name');
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

  getPackage(id) {
    return new Promise((resolve, reject) => {
      this.r.table('packages').get(id).run(this.conn, (err, result) => {
        if (err) {
          reject(err);
        } else if (!result) {
          reject(new this.ApplicationError.NotFound(`Package with id ${id} does not exist in nomjs-registry`));
        } else {
          resolve(result);
        }
      });
    });
  }

  createPackage(packageInfo) {
    return new Promise((resolve, reject) => {
      this.r.table('packages').insert(packageInfo).run(this.conn, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }
}

module.exports = RethinkStorage;
