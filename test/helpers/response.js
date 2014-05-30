var Faker = require('Faker')
  , chai = require('chai')
  , mongoose = require('mongoose')
  , moment = require('moment')
  , Seq = require('seq')
  , Share = require('./share');


module.exports = {
  generate: function(opts, question) {
    opts.object = {
      objectType: 'formResponse',
      originalContent: Faker.Lorem.words().join(' '),
      content: Faker.Lorem.words().join(' '),
      correct: 1,
      progress: 1,
      question: {
        id: question.id,
        content: question.content
      }
    };
    return Share.generate(opts);
  },

  create: function(token, question, opts, cb) {
    var share = this.generate(opts, question);
    request
      .post('/share')
      .send(share)
      .set('Authorization', token)
      .end(cb);
  }
};