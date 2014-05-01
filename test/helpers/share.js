var Faker = require('Faker')
  , chai = require('chai');

var verbs = ['completed', 'liked', 'joined', 'assigned', 'created']
  , types = ['comment', 'assignment'];

var Share = module.exports = {
  post: function(opts, groups, authToken, cb) {
    var share = Share.generate(opts, groups);
    request
      .post('/share')
      .set('Authorization', authToken)
      .send(share)
      .end(cb);
    return share;
  },
  queue: function(opts, groups, authToken, cb) {
    var share = Share.generate(opts, groups);
    share.status = 'pending';
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
  generate: function(opts, groups) {
    opts = opts || {};
    var share = _.defaults(opts, {
      verb: _.sample(verbs),
      object: Share.generateObject(opts.object),
      payload: {},
      type: _.sample(types)
    });
    share.to = { addresses: [] };
    _.each([].concat(groups), function(group) {
      share.to.addresses.push({id: group, access: [
        {type: 'public', role: 'teacher'},
        {type: 'group', role: 'student', id: group}
      ]});
    });
    return share;
  },
  generateObject: function(opts) {
    opts = opts || {};
    var name = Faker.Company.catchPhrase();
    return _.defaults(opts, {
      type: 'post',
      url: '/' + ['object', Faker.Helpers.slugify(name)].join('/')
    });
  },
  del: function(shareId, authToken, cb) {
    request
      .del('/share/' + shareId)
      .set('Authorization', authToken)
      .end(cb);
  }
};