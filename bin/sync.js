#!/usr/bin/env node

var mongo = require('mongodb');
var mongoURI = require('mongodb-uri');
var spawn = require('child_process').spawn;


var remote = mongoURI.parse(process.env.MONGO_PRODUCTION_URL);
var local = mongoURI.parse(process.env.MONGOHQ_URL);

console.log('local', local);
console.log('remote', remote);


var mongodump = spawn('mongodump', [], {stdio: 'inherit'});
mongodump.on('error', function(err) {
  console.log('error', err.stack);
});