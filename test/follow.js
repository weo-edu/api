var User = require('./helpers/user')
var Group = require('./helpers/group')
var awaitHooks = require('./helpers/awaitHooks')
var assert = require('assert')

require('./helpers/boot')

/**
 * Vars
 */
describe('following', function() {
  var user1, user2, board

  beforeEach(function *() {
    user1 = yield User.createAndLogin()
    user2 = yield User.createAndLogin()

    board = yield Group.create({groupType: 'board'}, user1)
  })

  it('follow a board', function *() {
    yield Group.follow(board.id, user2)

    var followers = yield Group.followers(board.id)
    assert.equal(followers[0].id, user2._id)

    followers = yield User.followers(user1.id)
    assert.equal(followers[0].id, user2._id)

    yield Group.unfollow(board.id, user2)

    followers = yield Group.followers(board.id)
    assert.equal(followers.length, 0)
  })

  it('should keep track of follower/following counts', function *() {
    yield Group.follow(board.id, user2)

    var user = yield User.get(user2.id)
    assert.equal(user.following, 1)

    user = yield User.get(user1.id)
    assert.equal(user.followers, 1)

    yield User.follow(user1.id, user2)

    user = yield User.get(user1.id)
    assert.equal(user.followers, 1)

    user = yield User.get(user2.id)
    assert.equal(user.following, 1)

    yield Group.unfollow(board.id, user2)
    yield User.unfollow(user1.id, user2)

    user = yield User.get(user1.id)
    assert.equal(user.followers, 0)

    user = yield User.get(user2.id)
    assert.equal(user.following, 0)
  })

  it('should follow a users existing boards', function *() {
    yield User.follow(user1.id, user2)

    var followers = yield Group.followers(board.id)
    assert.equal(followers[0].id, user2.id)
  })

  it('should follow a users new boards', function *() {
    yield User.follow(user1.id, user2)
    var board2 = yield Group.create({groupType: 'board'}, user1)
    yield awaitHooks()
    var followers = yield Group.followers(board2.id)
    assert.equal(followers[0].id, user2.id)
  })

  it('should not unfollow a user when you stop following their boards', function *() {
    yield User.follow(user1.id, user2)
    yield Group.unfollow(board.id, user2)

    var followers = yield User.followers(user1.id)
    assert.equal(followers[0].id, user2.id)
  })
})