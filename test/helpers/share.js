var Faker = require('Faker')
var chai = require('chai')
var access = require('lib/access/helpers')
var Group = require('lib/Group/model')
var ShareModel = require('lib/Share/model')
var asArray = require('as-array')
var _ = require('lodash')

var verbs = ['completed', 'liked', 'joined', 'assigned', 'created']

var Share = module.exports = {
  post: function(opts, groups, authToken) {
    var share = Share.generate(opts, groups)
    return request
      .post('/share')
      .set('Authorization', authToken)
      .send(share)
      .end()
  },
  queue: function(opts, groups, authToken) {
    var share = Share.generate(opts, groups)
    share.channels = ['share!' + share.id + '.drafts']
    return request
      .post('/share')
      .set('Authorization', authToken)
      .send(share)
      .end()
  },
  update: function(share, authToken) {
    return request
      .put('/share/' + share.id)
      .set('Authorization', authToken)
      .send(share)
      .end()
  },
  copy: function(share, authToken) {
    return request
      .post('/share/' + share.id + '/copy')
      .set('Authorization', authToken)
      .end()
  },
  assign: function(share, groups, authToken) {
    return request
      .put('/share/' + share.id + '/assign')
      .set('Authorization', authToken)
      .send({to: groups})
      .end()
  },
  pin: function(share, groups, authToken) {
    return request
      .put('/share/' + share.id + '/pin')
      .set('Authorization', authToken)
      .send({to: groups})
      .end()
  },
  child: function(parent, objectType, channelFn) {
    var parent = new ShareModel(parent)
    var child = parent.createChild(objectType, {
      channels: channelFn(parent)
    })
    return child.toJSON()
  },
  like: function(share, user) {
    return request
      .put('/share/' + share.id + '/like')
      .set('Authorization', user.token)
      .end()
  },
  unlike: function(share, user) {
    return request
      .put('/share/' + share.id + '/unlike')
      .set('Authorization', user.token)
      .end()
  },
  likes: function(user) {
    return request
      .get('/user/' + user.id + '/likes')
      .end()
  },
  getInstance: function(token, id, userId) {
    return request
      .get('/share/' + id + '/instance/' + userId)
      .set('Authorization', token)
      .end()
  },
  score: function (token, id, questionId, scaled) {
    return request
      .put('/instance/' + id + '/score/' + questionId)
      .set('Authorization', token)
      .send({scaled: scaled})
      .end()
  },
  turnIn: function (id, token) {
    return request
      .put('/instance/' + id + '/turned_in')
      .set('Authorization', token)
      .end()
  },
  answer: function (token, id, questionId, answer) {
    return request
      .put('/instance/' + id + '/question/' + questionId + '/response')
      .set('Authorization', token)
      .send({answer: answer})
      .end()
  },
  activities: function(token, userId) {
    return request
      .get('/share?channel=user!' + userId + '.activities')
      .set('Authorization', token)
      .end()
  },
  feed: function(query, authToken) {
    if (!_.isObject(query) || _.isArray(query))
      query = {channel: query}

    return request
      .get('/share')
      .set('Authorization', authToken)
      .query(query)
      .end()
  },
  generate: function(opts, groups) {
    opts = opts || {}
    var share = _.defaults(opts, {
      shareType: 'share',
      verb: _.sample(verbs),
      object: Share.generateObject(opts.object)
    })

    share.contexts = opts.contexts || asArray(opts.contexts || groups).map(function(group) {
      return {
        descriptor: Group.toAbstractKey(group),
        allow: [
          access.entry('group', 'student', Group.toAbstractKey(group)),
          access.entry('group', 'teacher', Group.toAbstractKey(group))
        ]
      }
    })

    if(! share.channels) {
      share.channels = share.contexts.map(function(context) {
        return 'group!' + context.descriptor.id + '.board'
      })
    }

    delete share.context
    return share
  },
  generateObject: function(opts) {
    opts = opts || {}
    var name = Faker.Company.catchPhrase()
    return _.defaults(opts, {
      objectType: 'post',
      originalContent: 'test'
    })
  },
  del: function(shareId, authToken) {
    return request
      .del('/share/' + shareId)
      .set('Authorization', authToken)
      .end()
  },
  members: function(shareId, context, authToken) {
    return request
      .get('/share/' + shareId + '/members?context=' + context)
      .set('Authorization', authToken)
      .end()
  }
}
