var User = require('lib/User').model;
var client = require('lib/knox');
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
        type: 'admin'
      }, function(err, u) {
        user = u;
        client.copyFile('/originals/default/weo.png', '/' + user.id, {'x-amz-acl': 'public-read'}, function(err) {
          if (err) {
            console.error('Error setting up avatar for user:' + user.id);
          }
        });
        complete(err, user);
      });
    });
  });
};