var Faker = require('Faker')
  , chai = require('chai');

var User = module.exports = {
  create: function(opts, cb) {
    opts = opts || {};
    request
      .post('/user')
      .send(_.defaults(opts, {
        type: 'teacher',
        first_name: Faker.Name.firstName(),
        last_name: Faker.Name.lastName(),
        username: Faker.Internet.userName(),
        password: 'testpassword',
        password_confirmation: opts.password || 'testpassword'
      }))
      .end(cb);
    return opts;
  },
  login: function(username, password, cb) {
    request
      .post('/user/login')
      .send({username: username, password: password})
      .end(cb);
  }
};