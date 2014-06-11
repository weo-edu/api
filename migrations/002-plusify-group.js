var chug = require('chug')(process.env.MONGOHQ_URL);
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
  chug.src('groups', {})
    .pipe(chug.transform(_.invert(map)))
    .pipe(chug.dest('group'))
    .on('end', next);
};
