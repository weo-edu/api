/**
 * Importss
 */
var User = require('./helpers/user')
var Live = require('./helpers/live')

require('./helpers/boot')

/**
 * Tests
 */

describe('socket', function() {
  it('should connect with valid token', function *() {
    var user = yield User.createAndLogin()
    yield Live.connectUser(user)
  })
})