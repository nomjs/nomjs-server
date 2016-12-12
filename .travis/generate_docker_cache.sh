#!/usr/bin/env bash

if [ ! -d "docker" ]
then
  mkdir docker
  docker export rethinkdb | gzip -c > docker/rethinkdb_export.tgz
  docker export redis | gzip -c > docker/redis.tgz
fi
