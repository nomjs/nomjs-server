'use strict';

const Ravel = require('ravel');
const rp = require('request-promise');

class UnscopedPackageError extends Ravel.Error {
  constructor(msg) {
    super(msg, constructor, 308);
  }
}

class UnsubmittedPackageError extends Ravel.Error {
  constructor(msg) {
    super(msg, constructor, 307);
  }
}

/**
 * Logic for listing, retrieving, publishing packages
 */
class Packages extends Ravel.Module {

  isScoped(id) {
    // TODO should we check for the slash as well? This is faster, but maybe not sufficient.
    return id[0] === '@';
  }

  _retrieveInfo(id) { //eslint-disable-line no-unused-vars
    return Promise.reject(new UnsubmittedPackageError({
      error: `nom can't find the package you're looking for.\nPlease encourage the developer to submit it to nom!`
    }));
  }

  /**
   * Re-encode a package id to use urlencoded format for slashes
   */
  encode(id) {
    return id.replace('/','%2f');;
  }

  // TODO: make it json instead of text but its actually returning!
  _retrieveInfoFromNpm(id) {
    return new Promise((resolve, reject) => {
      rp(`https://registry.npmjs.org/${this.encode(id)}`)
        .then((response) => {
          resolve(response);
        })
        .catch((err) => {
          reject(new Error({error: err}));
        });
    });
  }
  // _retrieveInfoFromNpm(id) {
  //   // TODO env var instead of hard coding registry url?
  //   return rp(`https://registry.npmjs.org/${this.encode(id)}`)
  //     .then(function(response) {
  //       console.log('=== NPM PROXY SUCCESS ===');
  //       return response;
  //     })
  //     .catch(function(err) {
  //       // TODO return a specific error like NpmProxyError
  //       // return Promise.reject(new Error({error: err}));
  //       console.log('=== NPM PROXY ERROR ===');
  //       return new Error({error: err});
  //     });
  // }

  /**
   * Retrieve package information based on a package name
   * @param id {String} the package name (such as @raveljs/ravel).
   * @param query {Object} optional, if specifies proxynpm then will retrieve package info from npm.
   * @return {Promise} resolves if the package is in the nom registry, rejects otherwise.
   */
  info(id, query) {
    const opts = query || {};  // no default parameters in node yet
    this.log.info(`client asked for info on: ${id}`);

    if (this.isScoped(id)) {
      return this._retrieveInfo(id);
    } else if (opts.proxynpm) {
      return this._retrieveInfoFromNpm(id);
    } else {
      return Promise.reject(new UnscopedPackageError({
        error: 'nom does not permit unscoped packages'
      }));
    }
  }
}

module.exports = Packages;
