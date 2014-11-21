var User = require('lib/User').model;
var lock = require('redis-lock')(require('lib/redis').default);
var user;

module.exports = function createWeoUser(next) {
  if(user) return next(null, user);

  lock('weo-user', function(done) {
    function complete(err, data) {
      next(err, data);
      done();
    }

    User.findOne({username: 'weotip'}, function(err, u) {
      if(err) return complete(err);
      if(u) return complete(null, user = u);

      User.create({
        name: {
          givenName: 'Weo',
          familyName: 'Tips'
        },
        username: 'weotip',
        password: 'elliotTheMang',
        userType: 'admin'
      }, function(err, u) {
        user = u;
        user.setAvatar('/originals/default/weo.png', function(err) {
          err && console.error('Error setting up avatar for user:' + user.id);
          complete(err, user);
        });
      });
    });
  });
};