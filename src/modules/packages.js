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

class NpmProxyError extends Ravel.Error {
  constructor(msg) {
    super(msg, constructor, 500);
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

  getScope(id) {
    const scope = id.match(/^@([\w\-]+)\/([\w\-]+)$/);
    if (scope === null) {
      throw new UnscopedPackageError(`Package id ${id} is not a scoped package`);
    }
    return scope[1];
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
    return id.replace('/','%2f');
  }

  // TODO env var instead of hard coding registry url?
  _retrieveInfoFromNpm(id) {
    let rpOptions = {
      uri: `https://registry.npmjs.org/${this.encode(id)}`,
      json: true
    };

    this.log.debug(`Proxying to npm: ${rpOptions.uri}`);
    return new Promise((resolve, reject) => {
      rp(rpOptions)
        .then((response) => resolve(response))
        .catch((err) => {
          let errMessage = `Unable to retrieve package info for ${id} from npm`;
          this.log.error(errMessage, err);
          reject(new NpmProxyError({error: errMessage}));
        });
    });
  }

  /**
   * Retrieve package information based on a package name
   * @param id {String} the package name (such as @raveljs/ravel).
   * @param query {Object} optional, if specifies proxynpm then will retrieve package info from npm.
   * @return {Promise} resolves if the package is in the nom registry, or if proxynpm is requested
   *                   and the package is found in npm, rejects otherwise.
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

  /**
   * Create or update package info and publish tarballs to blob store
   * @param {Object} args:
   *   @param {String} name
   *   @param {String} description
   *   @param {Object} dist-tags
   *   @param {Object} versions
   *   @param {String} readme
   *   @param {Object} _attachments
   * @return {Promise} resolves when package publish is compmlete, rejects with any errors
   */
  publish(args) { //eslint-disable-line no-unused-vars
    return Promise.reject(new this.ApplicationError.NotImplemented('Not implemented yet :)'));
  }
}

module.exports = Packages;
