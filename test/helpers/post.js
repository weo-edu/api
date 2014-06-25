var Faker = require('Faker')
  , chai = require('chai')
  , mongoose = require('mongoose')
  , moment = require('moment')
  , Seq = require('seq')
  , Share = require('./share');


var Post = module.exports = {
  generate: function(opts, groups) {
    var share = Share.generate(opts, groups);
    delete share.verb;
    _.defaults(share.object, {
      originalContent: Faker.Lorem.paragraph(),
      objectType: 'post'
    });
    return share;
  },

  create: function(token, type, opts, groups, cb) {
    var share = this.generate(opts, groups);
    share.object.objectType = type;
    request
      .post('/share')
      .send(share)
      .set('Authorization', token)
      .end(cb);
  }
};