var Faker = require('Faker')
  , chai = require('chai');

var verbs = ['completed', 'liked', 'joined', 'assigned', 'created']
  , types = ['comment', 'assignment'];

var Share = module.exports = {
  post: function(opts, groups, authToken, cb) {
    var share = Share.generate(opts);
    share.to = [].concat(groups);
    request
      .post('/share')
      .set('Authorization', authToken)
      .send(share)
      .end(cb);
    return share;
  },
  queue: function(opts, groups, authToken, cb) {
    var share = Share.generate(opts);
    share.to = [].concat(groups);
    share.queue = true;
    request
      .post('/share')
      .set('Authorization', authToken)
      .send(share)
      .end(cb);
    return share;
  },
  feed: function(user, groups, authToken, cb) {
    if (!cb) {
      cb = authToken;
      authToken = groups;
      groups = undefined;
    }
    request
      .get('/' + [user.type, 'shares'].join('/'))
      .set('Authorization', authToken)
      .query({to: groups})
      .end(cb);
  },
  generate: function(opts) {
    opts = opts || {};
    return _.defaults(opts, {
      verb: _.sample(verbs),
      object: Share.generateObject(opts.object),
      payload: {},
      type: _.sample(types)
    });
  },
  generateObject: function(opts) {
    opts = opts || {};
    var name = Faker.Company.catchPhrase();
    return _.defaults(opts, {
      id: 'fakeObjectId',
      name: name,
      link: '/' + ['object', Faker.Helpers.slugify(name)].join('/')
    });
  },
  del: function(shareId, authToken, cb) {
    request
      .del('/share/' + shareId)
      .set('Authorization', authToken)
      .end(cb);
  }
};