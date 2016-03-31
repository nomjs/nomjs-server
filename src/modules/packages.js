'use strict';

const Ravel = require('ravel');

/**
 * Logic for listing, retrieving, publishing packages
 */
class Packages extends Ravel.Module {
  info(id) {
    this.log.info(`client asked for info on: ${id}`);
    return new Promise((resolve, reject) => {
      reject(new this.ApplicationError.NotFound({
        error: 'Not found'
      }));
    });
  }
}

module.exports = Packages;
