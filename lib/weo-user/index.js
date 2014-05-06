var User = require('lib/User').model;
var weoId = 10;
var user;

module.exports = function createWeoUser(next) {
  if(user) return next(null, user);

  User.findOne(weoId).exec(function(err, u) {
    if(err) return next(err);
    if(u) return next(null, user = u);

    User.create({
      id: weoId,
      name: {
        first: 'Weo',
        last: 'Tips'
      },
      username: 'weotip',
      password: 'elliotTheMang',
      type: 'admin'
    }).exec(function(err, u) {
      next(err, user = u);
    });
  });
};