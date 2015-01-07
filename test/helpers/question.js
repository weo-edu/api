var Faker = require('Faker');
var Seq = require('seq');
var UserHelper = require('./user');
var Share = require('./share');
var ObjectId = require('mongoose').Types.ObjectId;

var Question = module.exports = {
  generate: function(opts, groups) {
    opts = opts || {};
    opts.object = {objectType : 'section'};
    var share = Share.generate(opts, groups);

    var correctId = new ObjectId();

    delete share.verb;
    share.object.attachments = [{
      objectType: 'question',
      originalContent: 'How old are you?',
      attachments: [
        {
          _id: correctId,
          correctAnswer: [correctId],
          objectType: 'choice',
          displayName: '18'
        }
      ]
    }];
    return share;
  },
  create: function(token, opts, cb) {
    if(arguments.length < 3) {
      cb = opts;
      opts = {};
    }

    var share = this.generate(opts, opts.context);
    delete opts.context;
    request
      .post('/share')
      .send(share)
      .set('Authorization', token)
      .end(cb);
  }
};