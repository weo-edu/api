/**
 * Imports
 */
var User = require('./helpers/user')
var Group = require('./helpers/group')
var awaitHooks = require('./helpers/awaitHooks')
var assert = require('assert')
var matches = require('lodash.matches')

require('./helpers/boot')

/**
 * Tests
 */
describe('Board', function() {
  var user
  before(function *() {
    user = yield User.createAndLogin()
  })

  describe('create', function(){
    it('should create new group and add user to group', function *() {
      var res = yield request
        .post('/board')
        .send(Group.generate())
        .set('Authorization', user.token)

      assert.equal(res.status, 201)

      var group = res.body
      res = yield request
        .get('/' + [user.userType, user.id].join('/'))
        .set('Authorization', user.token)

      assert.equal(res.status, 200)
      assert(res.body.groups.some(matches({id: group.id})))
    })
  })
})
