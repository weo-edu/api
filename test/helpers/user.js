var Faker = require('Faker');
var chai = require('chai');
var Seq = require('seq');

var User = module.exports = {
  generate: function(opts) {
    opts = opts || {};
    _.defaults(opts, {
      type: 'teacher',
      first_name: Faker.Name.firstName(),
      last_name: Faker.Name.lastName(),
      groups: ['fakeGroupId'],
      username: Faker.Internet.email(),
      password: 'testpassword',
      password_confirmation: opts.password || 'testpassword'
    });
    if(opts.type === 'teacher') {
      opts.title = 'Mr.';
    }
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
        if(res.status === 201)
          opts.id = res.body.id;
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
        cb(null, user);
      });
  }
};