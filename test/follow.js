var UserHelper = require('./helpers/user')
var GroupHelper = require('./helpers/group')
var thunkify = require('thunkify')
var assert = require('assert')
var awaitHooks = require('./helpers/awaitHooks')

/**
 * Vars
 */
var createAndLogin = thunkify(UserHelper.createAndLogin)
var createGroup = thunkify(GroupHelper.create)
var followBoard = thunkify(GroupHelper.follow)
var unfollowBoard = thunkify(GroupHelper.unfollow)
var followUser = thunkify(UserHelper.follow)
var unfollowUser = thunkify(UserHelper.unfollow)
var getUser = thunkify(UserHelper.get)
var getBoardFollowers = thunkify(GroupHelper.followers)
var getUserFollowers = thunkify(UserHelper.followers)

require('./helpers/boot')

describe('following', function() {
  var user1, user2, board

  beforeEach(function *() {
    user1 = yield createAndLogin()
    user2 = yield createAndLogin()

    board = yield createGroup({groupType: 'board'}, user1)
  })

  it('follow a board', function *() {
    yield followBoard(board.id, user2)

    var followers = yield getBoardFollowers(board.id)
    assert.equal(followers[0].id, user2._id)

    followers = yield getUserFollowers(user1.id)
    assert.equal(followers[0].id, user2._id)

    yield unfollowBoard(board.id, user2)

    followers = yield getBoardFollowers(board.id)
    assert.equal(followers.length, 0)
  })

  it('should keep track of follower/following counts', function *() {
    yield followBoard(board.id, user2)

    var user = yield getUser(user2.id)
    assert.equal(user.following, 1)

    user = yield getUser(user1.id)
    assert.equal(user.followers, 1)

    yield followUser(user1.id, user2)

    user = yield getUser(user1.id)
    assert.equal(user.followers, 1)

    user = yield getUser(user2.id)
    assert.equal(user.following, 1)

    yield unfollowBoard(board.id, user2)
    yield unfollowUser(user1.id, user2)

    user = yield getUser(user1.id)
    assert.equal(user.followers, 0)

    user = yield getUser(user2.id)
    assert.equal(user.following, 0)
  })

  it('should follow a users existing boards', function *() {
    yield followUser(user1.id, user2)

    var followers = yield getBoardFollowers(board.id)
    assert.equal(followers[0].id, user2.id)
  })

  it('should follow a users new boards', function *() {
    yield followUser(user1.id, user2)
    var board2 = yield createGroup({groupType: 'board'}, user1)
    yield awaitHooks
    var followers = yield getBoardFollowers(board2.id)
    assert.equal(followers[0].id, user2.id)
  })

  it('should not unfollow a user when you stop following their boards', function *() {
    yield followUser(user1.id, user2)
    yield unfollowBoard(board.id, user2)

    var followers = yield getUserFollowers(user1.id)
    assert.equal(followers[0].id, user2.id)
  })
})