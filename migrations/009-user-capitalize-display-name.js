var chug = require('mongo-chug')(require('../lib/config').mongo.url);
var es = require('event-stream');
var qs = require('querystring');
var _ = require('lodash');



exports.up = function(next){
  chug.src('users')
    .pipe(es.through(function(user) {
      if (user.displayName) {
        user.displayName = _.without(user.displayName.split(' '), '').map(function(part) {
          return part[0].toUpperCase() + part.slice(1);
        }).join(' ');
      }

      _.each(['givenName', 'familyName'], function(prop) {
        if (!user.name || !user.name[prop]) return;

        user.name[prop] = _.without(user.name[prop].split(' '), '').map(function(part) {
          return part[0].toUpperCase() + part.slice(1);
        }).join(' ');
      });
      this.emit('data', user);
    }))
    .pipe(chug.dest('users'))
    .on('end', next);
};

exports.down = function(next){
  next();
};