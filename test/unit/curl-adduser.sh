#!/bin/bash

curl -vvv -H 'Content-Type: application/json' -H 'Accept: application/json' -XPUT -d '{ "_id": "org.couchdb.user:nomjs-bot", "name": "nomjs-bot", "password": "bo7bo7bo7bo7bo7", "email": "bot@nomjs.com", "type": "user", "roles": [], "date": "2016-12-21T02:36:30.105Z" }' http://localhost:9080/-/user/org.couchdb.user:nomjs-bot
