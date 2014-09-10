var Faker = require('Faker');
var chai = require('chai');
var Seq = require('seq');

function teacherDefaults() {
  return {
    userType: 'teacher',
    name: {
      givenName: sanitize(Faker.Name.firstName()),
      familyName: sanitize(Faker.Name.lastName()),
      honorificPrefix: 'Mr.'
    },
    // Meaningless, but real-looking mongo id
    //groups: ['535729acad50c37bb9c84df3'],
    email: sanitize(Faker.Internet.email()).toLowerCase(),
    username: sanitize(Faker.Internet.userName()),
    password: 'testpassword'
  };
}

function studentDefaults() {
  var defaults = teacherDefaults();
  delete defaults.name.honorificPrefix;
  delete defaults.email;
  defaults.userType = 'student';
  return defaults;
}

function sanitize(str) {
  return str.replace(/[^\s0-9a-zA-Z\@\.]/g, 'a');
}

var User = module.exports = {

  me: function(authToken, cb) {
    request
      .get('/user')
      .set('Authorization', authToken)
      .end(cb);
  },
  generate: function(opts) {
    opts = opts || {};
    var defaults = null;
    if (opts.userType === 'student') {
      defaults = studentDefaults();
    } else {
      defaults = teacherDefaults();
    }
    _.defaults(opts, defaults);
    return opts;
  },
  create: function(opts, cb) {
    if('function' === typeof opts) {
      cb = opts;
      opts = {};
    }

    opts = User.generate(opts);
    request
      .post('/' + opts.userType)
      .send(opts)
      .end(function(err, res) {
        // XXX Kind of hacky, but without it
        // it's too easy to forget to do this
        if(res.status === 201) {
          opts.id = opts._id = res.body._id;
        }
        return cb.apply(this, arguments);
      });
    return opts;
  },
  login: function(username, password, cb) {
    request
      .post('/auth/login')
      .send({username: username, password: password})
      .end(cb);
  },
  createAndLogin: function(opts, cb) {
    var user;
    if('function' === typeof opts) {
      cb = opts;
      opts = {};
    }

    Seq()
      .seq(function() {
        user = User.create(opts, this);
      })
      .seq(function(res) {
        if(res.statusCode !== 201) return cb('User creation failed', res);
        User.login(user.username, user.password, this);
      })
      .seq(function(res) {
        if(res.statusCode !== 200) return cb('User login failed', res);
        user.token = 'Bearer ' + res.body.token;
        user.socketToken = res.body.token;
        cb(null, user);
      });
  },
  updated: function(user, cb) {
    Seq()
      .seq(function() {
        User.me(user.token, this);
      })
      .seq(function(res) {
        var updated = res.body;
        updated.token = user.token;
        updated.socketToken = user.socketToken;
        cb(null, updated);
      })
  },
  changeAvatar: function(user, image, cb) {
    request
      .patch('/user/avatar')
      .set('Authorization', user.token)
      .send({image: image})
      .end(cb);
  },

  reputation: function(user, cb) {
    request
      .get('/user/reputation')
      .set('Authorization', user.token)
      .end(cb);
  },

  reset: function(token, password, cb) {
    request
      .patch('/user/reset')
      .send({token: token, password: password})
      .end(cb);
  }
};