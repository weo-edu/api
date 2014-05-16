#!/usr/bin/env node

var mongo = require('mongodb');
var mongoURI = require('mongodb-uri');


var remote = mongoURI.parse(process.env.MONGO_PRODUCTION_URL);
var local = mongoURI.parse(process.env.MONGOHQ_URL);

mongo.MongoClient.connect(process.env.MONGOHQ_URL, function(err, db) {
  if (err) throw err;

  db.admin().command({
    copydb: 1,
    fromhost: remote.hosts[0].host + ':' + remote.hosts[0].port,
    fromdb: remote.database,
    todb: local.database,
    username: remote.username,
    password: remote.password
  }, function (err, res) {
    console.log('sync', err, res);
  });
})