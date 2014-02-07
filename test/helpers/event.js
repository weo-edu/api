var Faker = require('Faker')
  , chai = require('chai');

var verbs = ['completed', 'liked', 'joined', 'assigned', 'created']
  , types = ['comment', 'assignment'];

var Event = module.exports = {
  post: function(opts, user, authToken, cb) {
    var evt = Event.generate(opts);
    request
      .post('/' + [user.type, 'events'].join('/'))
      .set('Authorization', authToken)
      .send(evt)
      .end(cb);
    return evt;
  },
  events: function(user, authToken, cb) {
    request
      .get('/' + [user.type, 'events'].join('/'))
      .set('Authorization', authToken)
      .end(cb);
  },
  feed: function(user, authToken, cb) {
    request
      .get('/' + [user.type, 'feed'].join('/'))
      .set('Authorization', authToken)
      .end(cb);
  },
  generate: function(opts) {
    opts = opts || {};
    return _.defaults(opts, {
      verb: _.sample(verbs),
      object: Event.generateObject(opts.object),
      payload: {},
      type: _.sample(types)
    });
  },
  generateObject: function(opts) {
    opts = opts || {};
    var name = Faker.Company.catchPhrase();
    return _.defaults(opts, {
      guid: 'fakeObjectId',
      name: name,
      url: '/' + ['object', Faker.Helpers.slugify(name)].join('/')
    });
  }
};