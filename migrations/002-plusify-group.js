var chug = require('chug')(require('../lib/config/').mongo.url);
var _ = require('lodash');

var map = {
  name: 'displayName',
  type: 'groupType'
};

exports.up = function(next){
  chug.src('group', {})
    .pipe(chug.transform(map))
    .pipe(chug.dest('groups'))
    .on('end', next);
};

exports.down = function(next){
  next();
  // chug.src('groups', {})
  //   .pipe(chug.transform(_.invert(map)))
  //   .pipe(chug.dest('group'))
  //   .on('end', next);
};
