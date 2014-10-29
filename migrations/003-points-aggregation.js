require('lib/db');
require('lib/schema-plugin-extend');
require('lib/schema-plugin-discriminator');
var Share = require('lib/Share/model');
var Section = require('lib/Object-Posts/Section/model');
var Question = require('lib/Question/model');
var aggreateChannel = require('lib/Share/hooks').aggregateChannel();


var concurrent = 50;

exports.up = function(next){
  var active = 0;
  var stream = Share.find().stream();
  stream.on('data', function(share) {
    active++;
    if (active > concurrent && !stream.paused)
      stream.pause();

    share.object.grade();
    aggreateChannel(share, function() {
      active--;
      if (active <= concurrent && stream.paused)
        stream.resume();
    });
  });
  stream.on('close', function() {
    setInterval(function() {
      if (!active)
        next();
    }, 1000);
  });

};

exports.down = function(next){
  next();
};
