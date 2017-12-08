'use strict';

const Ravel = require('ravel');
const inject = Ravel.inject;
const Module = Ravel.Module;

class UnscopedPackageError extends Ravel.Error {
  constructor (msg) {
    super(msg, Ravel.httpCodes.PERMANENT_REDIRECT);
  }
}

class UnsubmittedPackageError extends Ravel.Error {
  constructor (msg) {
    super(msg, Ravel.httpCodes.TEMPORARY_REDIRECT);
  }
}

class ExistingVersionError extends Ravel.Error {
  constructor (msg) {
    super(msg, Ravel.httpCodes.CONFLICT);
  }
}

class PrivatePackageError extends Ravel.Error {
  constructor () {
    super('nomjs-registry does not accept private packages', Ravel.httpCodes.BAD_REQUEST);
  }
}

class MissingAttachmentError extends Ravel.Error {
  constructor (msg) {
    super(msg, Ravel.httpCodes.BAD_REQUEST);
  }
}

class MaxPackageSizeError extends Ravel.Error {
  constructor (msg) {
    super(msg, Ravel.httpCodes.REQUEST_ENTITY_TOO_LARGE);
  }
}

/**
 * Logic for listing, retrieving, publishing packages
 */
@inject('rethink')
class Packages extends Module {

  constructor (rethink) {
    super();
    this.rethink = rethink;
  }

  isScoped (id) {
    // TODO should we check for the slash as well? This is faster, but maybe not sufficient.
    return id[0] === '@';
  }

  getScope (id) {
    this.getPackageName(id).scope;
  }

  getPackageName (id) {
    const scope = id.match(/^@([\w-]+)\/([\w-]+)$/);
    if (scope === null) {
      this.log.warn(`client requested an unscoped package: ${id}`);
      throw new UnscopedPackageError(`Package id ${id} is not a scoped package`);
    }
    return {
      scope: scope[1],
      name: scope[2]
    };
  }

  _retrieveInfo (id) { // eslint-disable-line no-unused-vars
    return this.rethink.getPackage(id)
      .catch((err) => {
        if (err instanceof this.ApplicationError.NotFound) {
          // create new package;
          return Promise.reject(new UnsubmittedPackageError({
            error: `nom can't find the package you're looking for.\nPlease encourage the developer to submit it to nom!`
          }));
        } else {
          return Promise.reject(err);
        }
      });
  }

  /**
   * Re-encode a package id to use urlencoded format for slashes
   */
  encode (id) {
    return id.replace('/', '%2f');
  }

  /**
   * Retrieve package information based on a package name
   * @param id {String} the package name (such as @raveljs/ravel).
   * @return {Promise} resolves if the package is in the nom registry, rejects otherwise.
   */
  info (id) {
    this.log.info(`client asked for info on: ${id}`);

    if (this.isScoped(id)) {
      return this._retrieveInfo(id);
    } else {
      this.log.warn(`client requested an unscoped package: ${id}`);
      return Promise.reject(new UnscopedPackageError({
        error: 'nom does not accept unscoped packages'
      }));
    }
  }

  shasum (id, version) {
    return this.info(id).then((info) => {
      return new Promise((resolve, reject) => {
        try {
          resolve(info.versions[version].dist.shasum);
        } catch (err) {
          reject(new Error(`shasum not found for package ${id} at version ${version}`));
        }
      });
    });
  }

  getLatestPackageVersion (npmPackageInfo) {
    try {
      const semver = npmPackageInfo['dist-tags'].latest;
      if (semver === null) { throw new Error(); }
      return semver;
    } catch (err) {
      throw new Error('no version with tag \'latest\'');
    }
  }

  getLatestPackageInfo (npmPackageInfo) {
    return npmPackageInfo.versions[this.getLatestPackageVersion(npmPackageInfo)];
  }

  getTarballFromRequest (name, version, npmPackageInfo) {
    if (npmPackageInfo._attachments === undefined || npmPackageInfo._attachments[`${name}-${version}.tgz`] === undefined) {
      throw new MissingAttachmentError(`Tarball for package ${name} at version ${version} not found.`);
    } else {
      const attachment = npmPackageInfo._attachments[`${name}-${version}.tgz`];
      const buff = Buffer.from(attachment.data, 'base64');
      const maxSize = this.params.get('max package size bytes');
      if (buff.length > maxSize) {
        throw new MaxPackageSizeError(
          `Tarball for package ${name} at version ${version} exceeds maximum package size of ${maxSize} bytes`);
      }
      return buff;
    }
  }

  getTarballFromDB (key) {
    return this.rethink.getTarball(key);
  }

  /**
   * Creates a new package and publishes tarball to blob store
   * @param {Object} publisher a github user profile representing the "publisher"
   * @param {Object} args a package object direct from the npm client, containing:
   *   @param {String} name
   *   @param {String} description
   *   @param {Object} dist-tags
   *   @param {Object} versions
   *   @param {String} readme
   *   @param {Object} _attachments
   * @return {Promise} resolves when package publish is creation, rejects with any errors
   */
  createPackage (publisher, args) {
    try {
      const currentTime = new Date();
      const pInfo = Object.create(null);
      // reject private packages
      if (args.private) { throw new PrivatePackageError(); }
      // get latest info from the versions hash
      const latest = this.getLatestPackageInfo(args);
      // copy over things we need
      pInfo.name = args.name;
      if (args.description) { pInfo.description = args.description; }
      pInfo['dist-tags'] = args['dist-tags'];
      pInfo.versions = args.versions;
      if (args.readme) { pInfo.readme = args.readme; }
      pInfo.maintainers = [{
        id: publisher.id,
        name: publisher.login,
        email: publisher.email,
        profile: publisher.html_url
      }]; // TODO Concat others on update .
      pInfo.time = {
        modified: currentTime.toISOString(),
        created: currentTime.toISOString()
      };
      pInfo.time[latest.version] = currentTime.toISOString();
      if (latest.contributors) { pInfo.contributors = latest.contributors; }
      if (latest.author) { pInfo.author = latest.author; }
      if (latest.readmeFilename) { pInfo.readmeFilename = latest.readmeFilename; }
      if (latest.homepage) { pInfo.homepage = latest.homepage; }
      if (latest.repository) { pInfo.repository = latest.repository; }
      if (latest.bugs) { pInfo.bugs = latest.bugs; }
      if (latest.license) { pInfo.license = latest.license; }
      if (latest.keywords) { pInfo.keywords = latest.keywords; }
      // store blob and package info
      const buffer = this.getTarballFromRequest(pInfo.name, latest.version, args);
      return this.rethink.createTarball(`${pInfo.name}-${latest.version}.tgz`, buffer).then(() => {
        return this.rethink.createPackage(pInfo);
      });
    } catch (err) {
      this.log.error(err.stack);
      return Promise.reject(err);
    }
  }

  /**
   * Updates an existing package and publishes tarball to blob store
   * @param {Object} publisher a github user profile representing the "publisher"
   * @param {Object} existing current package info in database
   * @param {Object} newInfo a package object direct from the npm client, containing:
   *   @param {String} name
   *   @param {String} description
   *   @param {Object} dist-tags
   *   @param {Object} versions
   *   @param {String} readme
   *   @param {Object} _attachments
   * @return {Promise} resolves when package publish is creation, rejects with any errors
   */
  updatePackage (publisher, existing, newInfo) {
    try {
      const currentTime = new Date();
      // reject private packages
      if (newInfo.private) { throw new PrivatePackageError(); }
      const oldVersion = this.getLatestPackageVersion(existing);
      const newVersion = this.getLatestPackageVersion(newInfo);

      if (newVersion === oldVersion) {
        throw new ExistingVersionError(`You cannot publish over the previously published version ${oldVersion}`);
      }

      const latest = this.getLatestPackageInfo(newInfo);

      if (newInfo.description) { existing.description = newInfo.description; }
      existing['dist-tags'].latest = newInfo['dist-tags'].latest; // overwrite latest tag
      existing.versions[newVersion] = latest; // add package info to 'versions' hash
      // overwrite package metadata with latest info
      if (newInfo.readme) { existing.readme = newInfo.readme; }
      // update maintainer info (push new, update existing)
      const existingMaintainers = existing.maintainers.filter(m => m.id === publisher.id);
      if (existingMaintainers.length === 0) {
        existing.maintainers.push({
          id: publisher.id,
          name: publisher.login,
          email: publisher.email,
          profile: publisher.html_url
        });
      } else {
        existingMaintainers.forEach(e => {
          e.name = publisher.login;
          e.email = publisher.email;
          e.profile = publisher.html_url;
        });
      }
      existing.time.modified = currentTime.toISOString();
      existing.time[newVersion] = currentTime.toISOString();
      if (latest.contributors) { existing.contributors = latest.contributors; }
      if (latest.author) { existing.author = latest.author; }
      if (latest.readmeFilename) { existing.readmeFilename = latest.readmeFilename; }
      if (latest.homepage) { existing.homepage = latest.homepage; }
      if (latest.repository) { existing.repository = latest.repository; }
      if (latest.bugs) { existing.bugs = latest.bugs; }
      if (latest.license) { existing.license = latest.license; }
      if (latest.keywords) { existing.keywords = latest.keywords; }
      // store blob and package info
      const buffer = this.getTarballFromRequest(existing.name, newVersion, newInfo);
      return this.rethink.createTarball(`${existing.name}-${newVersion}.tgz`, buffer).then(() => {
        return this.rethink.updatePackage(newInfo);
      });
    } catch (err) {
      this.log.error(err.stack);
      return Promise.reject(err);
    }
  }

  /**
   * Create or update package info and publish tarballs to blob store
   * @param {Object} publisher a github user profile representing the "publisher"
   * @param {Object} args:
   *   @param {String} name
   *   @param {String} description
   *   @param {Object} dist-tags
   *   @param {Object} versions
   *   @param {String} readme
   *   @param {Object} _attachments
   * @return {Promise} resolves when package publish is complete, rejects with any errors
   */
  publish (publisher, args) {
    return this.rethink.getPackage(args.name)
      .then((existing) => {
        // update existing package
        return this.updatePackage(publisher, existing, args);
      })
      .catch((err) => {
        if (err instanceof this.ApplicationError.NotFound) {
          // create new package;
          return this.createPackage(publisher, args);
        } else {
          return Promise.reject(err);
        }
      });
  }
}

module.exports = Packages;
