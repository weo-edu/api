#!/usr/bin/env node

var mongo = require('mongodb');
var mongoURI = require('mongodb-uri');
var spawn = require('child_process').spawn;


var remote = mongoURI.parse(process.env.MONGO_PRODUCTION_URL);
var local = mongoURI.parse(process.env.MONGOHQ_URL)

console.log('cwd', process.cwd());

spawn('./bin/mongodump', [
  '-h', remote.hosts[0].host + ':' + remote.hosts[0].port, 
  '-d', remote.database, 
  '-u', remote.username,
  '-p', remote.password], {stdio: 'inherit'});