#!/usr/bin/env node

var mongo = require('mongodb');
var mongoURI = require('mongodb-uri');
var spawn = require('child_process').spawn;

console.log('remote', process.env.MONGO_PRODUCTION_URL);
console.log('local', process.env.MONGO_URL);

var remote = mongoURI.parse(process.env.MONGO_PRODUCTION_URL);
var local = mongoURI.parse(process.env.MONGO_URL)

var BIN = process.env.NODE_ENV === 'production' ? './bin/' : '';

var mongodump = spawn(BIN + 'mongodump', [
  '-h', remote.hosts[0].host + ':' + remote.hosts[0].port,
  '-d', remote.database,
  '-u', remote.username,
  '-p', remote.password], {stdio: 'inherit'});

var host = local.hosts[0];
var localPort = host.port
host = host.host;

// construct args
var args = [
  '-h', host +  (localPort ? (':' + localPort) : ''),
  '-d', local.database,
];
if (local.username) {
  args = args.concat([
    '-u', local.username,
    '-p', local.password
  ]);
}
args.push('dump/' + remote.database);
args.push('--drop');


mongodump.on('exit', function() {
  spawn(BIN + 'mongorestore', args, {stdio: 'inherit'});
});