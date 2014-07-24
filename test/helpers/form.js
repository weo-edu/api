var Faker = require('Faker')
  , chai = require('chai')
  , moment = require('moment')
  , Seq = require('seq')
  , UserHelper = require('./user')
  , Share = require('./share');

var Form = module.exports = {
  generate: function(opts, groups) {
    var share = Share.generate(opts, groups);
    delete share.verb;
    share.object.attachments = [{
      objectType: 'poll',
      originalContent: Faker.Lorem.paragraph(),
      attachments: [{
        objectType: 'formQuestion',
        displayName: 'How old are you?'
      }]
    }];
    return share;
  },
  randomTo: function() {
    return '' + Math.random();
  },
  create: function(token, type, opts, cb) {
    var share = this.generate(opts, opts.to || opts.context || [this.randomTo()]);
    delete opts.context;
    request
      .post('/share')
      .send(share)
      .set('Authorization', token)
      .end(cb);
  }
};