'use strict';

const Resource = require('ravel').Resource;
const inject = require('ravel').inject;
const before = Resource.before;

/**
 * Endpoints for user login, etc.
 */
@inject('koa-better-body')
class UserResource extends Resource {
  constructor(bodyParser) {
    //TODO what is the dash?
    super('/-/user/');
    this.bodyParser = bodyParser();
  }

  @before('bodyParser')
  put(ctx) {
    console.dir(ctx.params);
    console.dir(ctx.request.body);
    throw new this.ApplicationError.NotImplemented({
      'error': 'nom doesn\'t support login/adduser yet!'
    });
  }
}

module.exports = UserResource;
