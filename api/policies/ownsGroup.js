var Seq = require('seq');
module.exports = function(paramName) {
  return function(req, res, next) {
    var param = req.param(paramName);
    if(! param)
      return this('You Are not the owner of that group');

    Seq()
      .seq(function() {
        User.findOne(req.user.id)
          .exec(this);
      })
      .seq(function(user) {
        Group.findOne({id: param, owners: user.id})
          .exec(this);
      })
      .seq(function(group) {
        next(group ? undefined : 'You are not the owner of that group');
        this();
      })
      .catch(function() {
        throw err;
      });
  };
};