var Faker = require('Faker')
  , chai = require('chai')
  , moment = require('moment')
  , Seq = require('seq');


var Post = module.exports = {
  generate: function(opts) {
    opts = opts || {};
    _.defaults(opts, {
      user: '' + Math.random(),
      title: Faker.Lorem.words(),
      body: Faker.Lorem.paragraph(),
      user_name: Faker.Name.findName()
    });

    return opts;
  },

  discussionId: function() {
    return '' + Math.random();
  },

  create: function(type, opts, cb) {
    var post = this.generate(opts);
    var discussionId = opts.discussion_id || this.discussionId();
    delete opts.discussion_id;
    request
      .post('/' + type + '/' + discussionId)
      .send(post)
      .end(cb);
  }
};

