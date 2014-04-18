var Faker = require('Faker')
  , chai = require('chai')
  , moment = require('moment')
  , Seq = require('seq')
  , UserHelper = require('./user');


var Assignment = module.exports = {
  generate: function(opts) {
    opts = opts || {};
    _.defaults(opts, {
      body: Faker.Lorem.paragraph(),
      max_score: 10,
      reward: 10
    });
    return opts;
  },

  create: function(token, type, opts, cb) {
    var assignment = this.generate(opts);
    assignment.type = type;
    var share = {to: opts.to || this.randomTo()};
    share.object = assignment;
    request
      .post('/assignment')
      .send(share)
      .set('Authorization', token)
      .end(cb);
  }
};