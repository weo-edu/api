var _ = require('lodash');

module.exports = function(paramName) {
  return function(req, res, next) {
    User.findOne(req.user.id)
      .exec(function(err, user) {
        if(err) throw err;

        var groups = req.param(paramName)
          , belongsTo = (user.groups || []).concat(user.id);

        if(! groups) {
          req.body[paramName] = belongsTo;
          groups = belongsTo;
        }
        groups = [].concat(groups);
        if(_.intersection(groups, belongsTo).length === groups.length)
          next();
        else
          res.send(403, 'You are not a member of that group');
      });
  };
};