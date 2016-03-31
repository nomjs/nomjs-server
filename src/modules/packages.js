'use strict';

const Ravel = require('ravel');

/**
 * Logic for listing, retrieving, publishing packages
 */
class Packages extends Ravel.Module {
  info(id) {
    this.log.info(`client asked for info on: ${id}`);
    return new Promise((resolve, reject) => {
      if (id[0] === '@') {
        reject(new this.ApplicationError.NotFound({
          error: `nom can't find the package you're looking for. Please encourage the developer to submit it to nom!`
        }));
      } else {
        reject(new this.ApplicationError.IllegalValue({
          error: 'nom does not permit unscoped packages'
        }));
      }
    });
  }
}

module.exports = Packages;
