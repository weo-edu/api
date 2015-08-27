/**
 * Imports
 */

var User = require('./helpers/user')
var Share = require('./helpers/share')
var Group = require('./helpers/group')
var awaitHooks = require('./helpers/awaitHooks')
var Live = require('./helpers/live')
var assert = require('assert')
var matches = require('lodash.matches')

require('./helpers/boot')

/**
 * Tests
 */

describe('nested share', function() {
  var user, group, post

  before(function *() {
    user = yield User.createAndLogin()
    group = yield Group.create({}, user)

    var res = yield Share.post({}, group, user.token)
    assert.equal(res.status, 201)
    post = res.body
  })

  it('should validate', function *() {
    var res = yield Share.post({channels: ['share!' + post.id + '.replies']}, group, user.token)
    assert.equal(res.status, 201)
  })

  it('nested feed should only contain nested shares', function *() {
    var nested = null
    var channel = 'share!' + post.id + '.replies'

    yield Live.connectUser(user)
    yield Live.subscribe(user, channel)

    var res = yield Share.post({channels: [channel]}, group, user.token)
    yield awaitHooks()
    nested = res.body

    res = yield Share.feed({context: group.id, channel: channel}, user.token)
    var shares = res.body.items
    assert(! shares.some(matches({_id: post.id})))
    assert.equal(user.messages.length, 1)
  })
})