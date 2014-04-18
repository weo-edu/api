var Seq = require('seq');
var _ = require('lodash');

module.exports = function(paramName) {
  return function(req, res, next) {
    var userId = req.param(paramName);
    if(! userId) return res.send(403, 'Invalid userId param');
    Seq()
      .par(function() {
        User.findOne(userId, this);
      })
      .par(function() {
        Group.ownedBy(req.user.id, this);
      })
      .seq(function(student, groups) {
        var inter = _.intersection(student.groups, _.pluck(groups, 'id'));
        inter.length ? next() : res.send(403, 'Unauthorized');
      })
      .catch(next);
  };
};