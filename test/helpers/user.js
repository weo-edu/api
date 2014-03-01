var Faker = require('Faker')
  , chai = require('chai');

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
  }
};