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

        if(_.intersection([].concat(groups), belongsTo).length
            === groups.length)
          next();
        else
          next('Access denied');
      });
  };
};