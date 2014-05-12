var Faker = require('Faker')
  , chai = require('chai')
  , moment = require('moment')
  , Seq = require('seq')
  , Share = require('./share');


var Post = module.exports = {
  generate: function(opts, groups) {
    var share = Share.generate(opts, groups);
    share.type = 'post';
    delete share.verb;
    _.defaults(share.object, {
      originalContent: Faker.Lorem.paragraph(),
    });
    return share;
  },

  randomTo: function() {
    return '' + Math.random();
  },

  create: function(token, type, opts, cb) {
    var share = this.generate(opts, opts.to || [this.randomTo()]);
    share.object.type = type;
    request
      .post('/post')
      .send(share)
      .set('Authorization', token)
      .end(cb);
  }
};