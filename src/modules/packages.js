'use strict';

const Ravel = require('ravel');

class UnscopedPackageError extends Ravel.Error {
  constructor(msg) {
    super(msg, constructor, 301);
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

  inRegistry(id) {
    return Promise.reject(`Requested package ${id} is not in the nom registry.`);
  }

  /**
   * Retrieve package information based on a package name
   * @param id {String} the package name (such as @raveljs/ravel).
   * @return {Promise} resolves if the package is in the nom registry, rejects otherwise
   */
  info(id) {
    this.log.info(`client asked for info on: ${id}`);

    return new Promise((resolve, reject) => {
      // is this a scoped package?
      if (this.isScoped(id)) {
        reject(new this.ApplicationError.NotFound({
          error: `nom can't find the package you're looking for.\nPlease encourage the developer to submit it to nom!`
        }));
      } else {
        // not a scoped package
        reject(new UnscopedPackageError({
          error: 'nom does not permit unscoped packages'
        }));
      }
    });
  }
}

module.exports = Packages;
