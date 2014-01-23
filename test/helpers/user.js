var Faker = require('Faker');

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
  }
};