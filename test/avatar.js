/**
 * Imports
 */
var User = require('./helpers/user')
var assert = require('assert')

require('./helpers/boot')

/**
 * Tests
 */
//XXX test avatar created when user is created
describe('Avatar controller', function() {
  var authToken, teacher, student

  before(function *() {
    teacher = User.generate()
    yield User.create(teacher)

    var res = yield User.login(teacher.username, teacher.password)
    authToken = 'Bearer ' + res.body.token
  })

  it('unauthenticated requests should not be allowed', function *() {
    var res = yield request
      .put('/avatar')
      .send({url: 'test.jpg'})
      .end()

    assert.equal(res.status, 401)
  })

  it('should error if there is no image', function *() {
    var res = yield request
      .put('/avatar')
      .set('Authorization', authToken)
      .end()

    assert.equal(res.status, 400)
  })

  it('should accept a valid avatar path', function *() {
    var res = yield request
      .put('/avatar')
      .set('Authorization', authToken)
      .send({url: 'https://www.weo.io/originals/decks/lotus.png'})
      .end()

    assert.equal(res.status, 200)
  })
})