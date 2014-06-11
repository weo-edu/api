var chug = require('chug')(require('../lib/config').mongo.url);
var _ = require('lodash');


var map = {
  type: 'userType',
  name: 'displayName',
  title: 'name.honorificPrefix',
  full_name: 'name.formatted',
  first_name: 'name.givenName',
  last_name: 'name.familyName'
};

exports.up = function(next){
  chug.src('user', {})
    .pipe(chug.transform(map))
    .pipe(chug.dest('users'))
    .on('end', next);
};

exports.down = function(next){
  chug.src('users', {})
    .pipe(chug.transform(_.invert(map)))
    .pipe(chug.dest('user'))
    .on('end', next);
};
