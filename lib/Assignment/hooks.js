var Share = require('lib/Share').model;
var Seq = require('seq');
var _ = require('lodash');

exports.addStudent = function(user, next) {
  var newGroups = _.difference(user.groups, user.previous('groups'));
  Seq(newGroups)
    .parEach(function(group) {
      var update = {$set: {}};
      update.$set['payload.' + group + '.students.' + user.id] = {progress: 0, score: 0, reward_claimed: false};
      Share.update({'to.board': group}, update, {multi: true}, this)
    })
    .seq(function() {
      next();
    })
    ['catch'](function(err) {
      next(err);
    })
};