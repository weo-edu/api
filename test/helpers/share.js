var Faker = require('Faker')
  , chai = require('chai')
  , access = require('lib/access');

var verbs = ['completed', 'liked', 'joined', 'assigned', 'created'];

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
  feed: function(user, query, authToken, cb) {
    if (!cb) {
      cb = authToken;
      authToken = groups;
      groups = undefined;
    }
    if (!_.isObject(query) || _.isArray(query))
      query = {board: query};
    request
      .get('/share')
      .set('Authorization', authToken)
      .query(query)
      .end(cb);
  },
  generate: function(opts, groups) {
    opts = opts || {};
    var share = _.defaults(opts, {
      verb: _.sample(verbs),
      object: Share.generateObject(opts.object),
      payload: {}
    });

    share.to = opts.to || [].concat(opts.board || groups).map(function(group) {
      return {
        board: group,
        allow: [
          access.entry('public', 'teacher'),
          access.entry('group', 'student', group)
        ]
      };
    });

    delete share.board;

    return share;
  },
  generateObject: function(opts) {
    opts = opts || {};
    var name = Faker.Company.catchPhrase();
    return _.defaults(opts, {
      objectType: 'post',
      url: '/' + ['object', Faker.Helpers.slugify(name)].join('/')
    });
  },
  del: function(shareId, authToken, cb) {
    request
      .del('/share/' + shareId)
      .set('Authorization', authToken)
      .end(cb);
  },
  members: function(shareId, board, authToken, cb) {
    request
      .get('/share/' + shareId + '/members?board=' + board)
      .set('Authorization', authToken)
      .end(cb)
  }
};