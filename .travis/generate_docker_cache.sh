#!/usr/bin/env bash

if [ ! -d ".travis/docker" ]
then
  mkdir .travis/docker
  docker export rethinkdb | gzip -c > .travis/docker/rethinkdb_export.tgz
  docker export redis | gzip -c > .travis/docker/redis.tgz
fi
