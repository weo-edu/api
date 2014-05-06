var Faker = require('Faker');
var chai = require('chai');
var Seq = require('seq');

function teacherDefaults() {
  return {
    type: 'teacher',
    name: {
      first: sanitize(Faker.Name.firstName()),
      last: sanitize(Faker.Name.lastName()),
      title: 'Mr.'
    },
    // Meaningless, but real-looking mongo id
    //groups: ['535729acad50c37bb9c84df3'],
    email: sanitize(Faker.Internet.email()).toLowerCase(),
    username: sanitize(Faker.Internet.userName()),
    password: 'testpassword',
    password_confirmation: 'testpassword',
  };
}

function studentDefaults() {
  var defaults = teacherDefaults();
  delete defaults.name.title;
  delete defaults.email;
  return defaults;
}

function sanitize(str) {
  return str.replace(/[^\s0-9a-zA-Z\@\.]/g, 'a');
}

var User = module.exports = {
  generate: function(opts) {
    opts = opts || {};
    var defaults = null;
    if (opts.type === 'student') {
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
      .post('/' + opts.type)
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
  }
};