require('lib/db');
require('lib/schema-plugin-extend');
require('lib/schema-plugin-discriminator');
var Share = require('lib/Share/model');
var aggreateChannel = require('lib/Share/hooks').aggregateChannel();

console.log('load migration');

var concurrent = 50;

exports.up = function(next){
  var active = 0;
  var stream = Share.find({}).stream();
  stream.on('data', function(share) {
    active++;
    if (active > concurrent && !stream.paused)
      stream.pause();

    share.autoGrade();
    aggreateChannel(share, function() {
      active--;
      if (active <= concurrent && stream.paused)
        stream.resume();
    });
  });
  stream.on('close', next);

};

exports.down = function(next){
  next();
};
