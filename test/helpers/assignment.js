var Faker = require('Faker')
  , chai = require('chai')
  , moment = require('moment')
  , Seq = require('seq')
  , UserHelper = require('./user')
  , Share = require('./share');

var Assignment = module.exports = {
  generate: function(opts, groups) {
    var share = Share.generate(opts, groups);
    _.defaults(share.object, {
      content: Faker.Lorem.paragraph(),
      max_score: 10,
      reward: 10
    })
    share.object.type = 'poll';
    return share;
  },

  create: function(token, type, opts, cb) {
    var share = this.generate(opts, opts.to);
    request
      .post('/assignment')
      .send(share)
      .set('Authorization', token)
      .end(cb);
    return share;
  }
};