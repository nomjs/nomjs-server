#!/usr/bin/env bash

if [ -d ".travis/docker" ]
then
  for image in `ls .travis/docker`
  do
    docker import .travis/docker/${image}
  done
fi
