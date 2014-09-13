var Faker = require('Faker')
  , Seq = require('seq')
  , UserHelper = require('./user')
  , Share = require('./share');

var Form = module.exports = {
  generate: function(opts, groups) {
    var share = Share.generate(opts, groups);
    delete share.verb;
    share.object.attachments = [{
      objectType: 'formQuestion',
      displayName: 'How old are you?',
      attachments: [
        {
          objectType: 'choice',
          displayName: '18'
        }
      ]
    }];
    return share;
  },
  randomTo: function() {
    return '' + Math.random();
  },
  getInstance: function(token, id, userId, cb) {
    request
      .get('/share/' + id + '/instance/' + userId)
      .set('Authorization', token)
      .end(cb);
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