/**
 * Imports
 */
var User = require('./helpers/user')
var assert = require('assert')

require('./helpers/boot')

/**
 * Tests
 */
describe('Auth controller', function() {
  it('should handle non-existent username', function *() {
    var res = yield User.login('badusername', 'test')
    assert.equal(res.status, 404)
    assert.equal(res.body.message, 'User not found')
  })

  it('should handle incorrect password', function *() {
    var res = yield User.create()
    var user = res.body
    assert.equal(res.status, 201)

    res = yield User.login(user.username, 'badpass')
    assert.equal(res.status, 401)
    assert.equal(res.body.message, 'Incorrect password')
  })

  it('should accept valid credentials', function *() {
    var user = User.generate()
    var res = yield User.create(user)
    assert.equal(res.status, 201)

    res = yield User.login(user.username, user.password)
    assert.equal(res.status, 200)

    ;['token', 'userType', 'username', 'id'].forEach(function(key) {
      assert.ok(res.body.hasOwnProperty(key))
    })
  })
})