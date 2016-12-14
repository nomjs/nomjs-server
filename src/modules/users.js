'use strict';

const Ravel = require('ravel');
const inject = Ravel.inject;
const Module = Ravel.Module;

@inject('rethink')
class Users extends Module {
  constructor (rethink) {
    super();
    this.rethink = rethink;
  }

  findOrCreateUser (githubProfile, email) {
    return this.rethink.findOrCreateUser(githubProfile, email);
  }

  removeUser (id) {
    return this.rethink.removeUser(id);
  }
}

module.exports = Users;
