var Faker = require('Faker')
  , chai = require('chai')
  , moment = require('moment')
  , Seq = require('seq');


var Post = module.exports = {
  generate: function(opts) {
    opts = opts || {};
    _.defaults(opts, {
      body: Faker.Lorem.paragraph(),
    });
    return opts;
  },

  randomTo: function() {
    return '' + Math.random();
  },

  create: function(token, type, opts, cb) {
    var post = this.generate(opts);
    post.type = type;
    var share = {to: opts.to || this.randomTo()};
    share.object = post;
    request
      .post('/post')
      .send(share)
      .set('Authorization', token)
      .end(cb);
  }
};

