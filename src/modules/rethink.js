'use strict';

const Ravel = require('ravel');
const inject = Ravel.inject;
const Module = Ravel.Module;
const prelisten = Module.prelisten;

@inject('rethinkdb')
class RethinkStorage extends Module {
  constructor (r) {
    super();
    this.r = r;
  }

  createDatabase (name) {
    return new Promise((resolve, reject) => {
      this.r.dbCreate(name).run(this.conn, err => {
        if (err && !err.message.includes('already exists')) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  createTable (name, pkey) {
    return new Promise((resolve, reject) => {
      this.r
        .tableCreate(name, {
          primaryKey: pkey || 'id'
        })
        .run(this.conn, err => {
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
  init () {
    this.r.connect(
      {
        db: this.params.get('rethink db name'),
        host: this.params.get('rethink host'),
        port: this.params.get('rethink port')
      },
      (err, conn) => {
        if (err) {
          this.log.error(err.stack);
          process.exit(1);
        } else {
          this.conn = conn;
          this.conn.once('error', e => {
            this.log.error(e.stack);
            process.exit(1);
          });
          this.conn.once('close', () => {
            this.log.error(
              'Connection to RethinkDB terminated cleanly but unexpectedly.'
            );
            process.exit(1);
          });

          this.createDatabase(this.params.get('rethink db name'))
            .then(() => {
              this.log.info(
                `Found or created databse ${this.params.get('rethink db name')}`
              );
              return this.createTable('packages', 'name');
            })
            .then(() => {
              this.log.info('Found or created packages table');
              return this.createTable('tarballs', 'name');
            })
            .then(() => {
              this.log.info('Found or created tarballs table');
              return this.createTable('users', 'id');
            })
            .then(() => {
              this.log.info('Found or created users table');
            })
            .catch(e => {
              this.log.error(e.stack);
              process.exit(1);
            });
        }
      }
    );
  }

  getUser (id) {
    return new Promise((resolve, reject) => {
      this.r
        .table('users')
        .get(id)
        .run(this.conn, (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
    });
  }

  findOrCreateUser (profile, email) {
    const user = {
      id: profile.id,
      email: email
    };
    return new Promise((resolve, reject) => {
      this.r
        .table('users')
        .insert(user, { conflict: 'update' })
        .run(this.conn, err => {
          if (err) {
            reject(err);
          } else {
            resolve(user);
          }
        });
    });
  }

  removeUser (id) {
    return new Promise((resolve, reject) => {
      this.r
        .table('users')
        .get(id)
        .delete()
        .run(this.conn, err => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
    });
  }

  getPackage (id) {
    return new Promise((resolve, reject) => {
      this.r
        .table('packages')
        .get(id)
        .run(this.conn, (err, result) => {
          if (err) {
            reject(err);
          } else if (!result) {
            reject(
              new this.ApplicationError.NotFound(
                `Package with id ${id} does not exist in nomjs-registry`
              )
            );
          } else {
            resolve(result);
          }
        });
    });
  }

  createPackage (packageInfo) {
    return new Promise((resolve, reject) => {
      this.r
        .table('packages')
        .insert(packageInfo)
        .run(this.conn, (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
    });
  }

  updatePackage (packageInfo) {
    return new Promise((resolve, reject) => {
      this.r
        .table('packages')
        .get(packageInfo.name)
        .update(packageInfo)
        .run(this.conn, (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
    });
  }

  createTarball (name, buffer) {
    return new Promise((resolve, reject) => {
      this.r
        .table('tarballs')
        .insert({ name: name, buffer: buffer })
        .run(this.conn, (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
    });
  }

  getTarball (key) {
    return new Promise((resolve, reject) => {
      this.r
        .table('tarballs')
        .get(key)
        .run(this.conn, (err, result) => {
          if (err) {
            reject(err);
          } else if (!result) {
            reject(
              new this.ApplicationError.NotFound(
                `Tarball with id ${key} does not exist in nomjs-registry`
              )
            );
          } else {
            resolve(result);
          }
        });
    });
  }

  getStars (userId) {
    return new Promise((resolve, reject) => {
      this.r
        .table('users')
        .get(userId)
        .run(this.conn, (err, result) => {
          if (err) {
            reject(
              new this.ApplicationError.NotFound(
                `User with id ${userId} does not exist in nomjs-registry`
              )
            );
          } else {
            resolve(result.stars);
          }
        });
    });
  }

  star (userId, packageId) {
    const r = this.r;
    const newStar = {};
    newStar[packageId] = true;
    return new Promise((resolve, reject) => {
      r
        .table('users')
        .get(userId)
        .update({
          stars: r
            .row('stars')
            .default({})
            .merge(newStar)
        })
        .run(this.conn, (err, result) => {
          if (err) {
            reject(
              new this.ApplicationError.NotFound(
                `User with id ${userId} does not exist in nomjs-registry`
              )
            );
          } else {
            resolve(result.stars);
          }
        });
    });
  }

  unstar (userId, packageId) {
    const r = this.r;
    return new Promise((resolve, reject) => {
      r
        .table('users')
        .get(userId)
        .update({
          stars: r.literal(
            r
              .row('stars')
              .default({})
              .without(packageId)
          )
        })
        .run(this.conn, (err, result) => {
          if (err) {
            reject(
              new this.ApplicationError.NotFound(
                `User with id ${userId} does not exist in nomjs-registry`
              )
            );
          } else {
            resolve(result.stars);
          }
        });
    });
  }
}

module.exports = RethinkStorage;
