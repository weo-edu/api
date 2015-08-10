/**
 * Imports
 */
var assert = require('assert')
var User = require('./helpers/user')
var Share = require('./helpers/share')

require('./helpers/boot')

/**
 * Tests
 */
describe('Liking', function() {
  var user, user2, share

  beforeEach(function *() {
    user = yield User.createAndLogin()
    user2 = yield User.createAndLogin()

    var res = yield request
      .post('/share')
      .set('Authorization', user.token)
      .send(createShare())
      .end()

    share = res.body
  })

  it('should add self to likers and be listed in likes', function *() {
    var res = yield Share.like(share, user)
    var s = res.body
    var liker = s.likers[0]
    assert.equal(liker.id, user.id)

    res = yield Share.likes(user)
    var likes = res.body.items
    assert.equal(likes.length, 1)
    assert.equal(likes[0]._id, share.id)
  })

  it('should track two different likes', function *() {
    var res = yield Share.like(share, user)
    var s = res.body
    assert.equal(s.likers.length, 1)

    res = yield Share.like(share, user2)
    var s = res.body
    assert.equal(s.likers.length, 2)
  })

  it('should not be possible twice', function *() {
    var res = yield Share.like(share, user)
    var s = res.body
    var liker = s.likers[0]
    assert.equal(liker.id, user.id)

    res = yield Share.like(share, user)
    assert.equal(res.status, 400)
  })


  it('should be undoable', function *() {
    var res = yield Share.like(share, user)
    var s = res.body
    var liker = s.likers[0]
    assert.equal(liker.id, user.id)

    res = yield Share.unlike(share, user)

    var s = res.body
    assert.equal(s.likers.length, 0)

    res = yield Share.likes(user)
    var likes = res.body.items
    assert.equal(likes.length, 0)
  })

  it('should not be unlikeable', function *() {
    var res = yield Share.unlike(share, user)
    assert.equal(res.status, 400)
  })
})

function createShare() {
  return {
    shareType: 'share',
    verb: 'assigned',
    displayName: 'asdlkfjas',
    object: {
      objectType: 'section',
      originalContent: 'Test'
    },
    contexts: [{
      descriptor: {displayName: 'Public', id: 'public', url: '/'},
      allow: [{id: 'public:teacher'}]
    }],
    channels: []
  }
}