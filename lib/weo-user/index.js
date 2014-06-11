var User = require('lib/User').model;
var client = require('lib/knox');
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
      user = u;
      client.copyFile('/originals/default/weo.png', '/' + user.id, {'x-amz-acl': 'public-read'}, function(err) {
        console.log('successfully copy file');
        if (err) {
          console.error('Error setting up avatar for user:' + user.id);
        }
      });
      next(err, user);
    });
  });
};