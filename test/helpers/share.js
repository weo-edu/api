var Faker = require('Faker');
var chai = require('chai');
var access = require('lib/access/helpers');
var Group = require('lib/Group/model');
var ShareModel = require('lib/Share/model');
var asArray = require('as-array');

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
    share.channels = ['share!' + share.id + '.drafts'];
    request
      .post('/share')
      .set('Authorization', authToken)
      .send(share)
      .end(cb);
    return share;
  },
  postShare: function(share, authToken, cb) {
    request
      .post('/share')
      .set('Authorization', authToken)
      .send(share)
      .end(cb);
  },
  updateShare: function(share, authToken, cb) {
    request
      .put('/share/' + share.id)
      .set('Authorization', authToken)
      .send(share)
      .end(cb);
  },
  updateInstance: function(inst, authToken, cb) {
    request
      .put('/share/' + inst.id + '/instance')
      .set('Authorization', authToken)
      .send(inst)
      .end(cb);
  },
  child: function(parent, objectType, channelFn) {
    var parent = new ShareModel(parent);
    var child = parent.createChild(objectType, {
      channels: channelFn(parent)
    });
    return child.toJSON();
  },
  getInstance: function(token, id, userId, cb) {
    request
      .get('/share/' + id + '/instance/' + userId)
      .set('Authorization', token)
      .end(cb);
  },
  activities: function(token, userId, cb) {
    request
      .get('/share?channel=user!' + userId + '.activities')
      .set('Authorization', token)
      .end(cb);
  },
  feed: function(query, authToken, cb) {
    if (!cb) {
      cb = authToken;
      authToken = groups;
      groups = undefined;
    }
    if (!_.isObject(query) || _.isArray(query))
      query = {channel: query};
    request
      .get('/share')
      .set('Authorization', authToken)
      .query(query)
      .end(cb);
  },
  generate: function(opts, groups) {
    opts = opts || {};
    var share = _.defaults(opts, {
      shareType: 'share',
      verb: _.sample(verbs),
      object: Share.generateObject(opts.object)
    });

    share.contexts = opts.contexts || asArray(opts.contexts || groups).map(function(group) {
      return {
        descriptor: Group.toAbstractKey(group),
        allow: [
          access.entry('group', 'student', Group.toAbstractKey(group)),
          access.entry('group', 'teacher', Group.toAbstractKey(group))
        ]
      };
    });

    if(! share.channels) {
      share.channels = share.contexts.map(function(context) {
        return 'group!' + context.descriptor.id + '.board';
      });
    }

    delete share.context;
    return share;
  },
  generateObject: function(opts) {
    opts = opts || {};
    var name = Faker.Company.catchPhrase();
    return _.defaults(opts, {
      objectType: 'post',
      originalContent: 'test'
    });
  },
  del: function(shareId, authToken, cb) {
    request
      .del('/share/' + shareId)
      .set('Authorization', authToken)
      .end(cb);
  },
  members: function(shareId, context, authToken, cb) {
    request
      .get('/share/' + shareId + '/members?context=' + context)
      .set('Authorization', authToken)
      .end(cb)
  }
};