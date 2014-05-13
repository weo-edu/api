var Faker = require('Faker')
  , chai = require('chai')
  , moment = require('moment')
  , Seq = require('seq')
  , UserHelper = require('./user')
  , Share = require('./share');

var Form = module.exports = {
  generate: function(opts, groups) {
    opts.object = {objectType: 'poll'};
    var share = Share.generate(opts, groups);
    delete share.verb;
    _.defaults(share.object, {
      content: Faker.Lorem.paragraph(),
      max_score: 10,
      reward: 10,
    })
    return share;
  },

  randomTo: function() {
    return '' + Math.random();
  },

  create: function(token, type, opts, cb) {
    var share = this.generate(opts, opts.to || opts.board || [this.randomTo()]);
    delete opts.board;
    request
      .post('/share')
      .send(share)
      .set('Authorization', token)
      .end(cb);
  }
};