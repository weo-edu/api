var User = require('lib/User').model;
var user;

module.exports = function createWeoUser(next) {
  if(user) return next(null, user);
  User.findOne({username: 'weotip'}, function(err, u) {
    if(err) return next(err);
    if(u) return next(null, user = u);

    User.create({
      name: {
        givenName: 'Weo',
        familyName: 'Tips'
      },
      username: 'weotip',
      password: 'elliotTheMang',
      type: 'admin'
    }, function(err, u) {
      next(err, user = u);
    });
  });
};