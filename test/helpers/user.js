var Faker = require('Faker')
  , chai = require('chai');

var User = module.exports = {
  generate: function(opts) {
    opts = opts || {};
    _.defaults(opts, {
      type: 'teacher',
      first_name: Faker.Name.firstName(),
      last_name: Faker.Name.lastName(),
      groups: ['group'],
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
    opts = User.generate(opts);
    request
      .post('/user')
      .send(opts)
      .end(cb);
    return opts;
  },
  login: function(username, password, cb) {
    request
      .post('/auth/login')
      .send({username: username, password: password})
      .end(cb);
  }
};