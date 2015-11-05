/**
 * Imports
 */

var User = require('./helpers/user')
var Share = require('./helpers/share')
var Group = require('./helpers/group')
var Question = require('./helpers/question')
var assert = require('assert')

require('./helpers/boot')

/**
 * Tests
 */

describe('grading', function () {
  var user, group, student, student2

  before(function *() {
    user = yield User.createAndLogin()
    group = yield Group.create({}, user)

    student = yield User.createAndLogin({userType: 'student'})
    yield Group.join(group, student)

    student2 = yield User.createAndLogin({userType: 'student'})
    yield Group.join(group, student2)
  })

  it('should not destroy prior grades when instances are updated', function *() {
    var res = yield Question.create(user.token, {context: group})
    var share = res.body

    res = yield Share.getInstance(user.token, share._id, student._id)
    var inst = res.body

    yield Share.score(user.token, inst._id, inst._object[0].attachments[0]._id, 0.7)
    res = yield Share.getInstance(user.token, share._id, student._id)

    assert.equal(res.body._object[0].attachments[0].points.scaled, 0.7)

    share.displayName = '111111'
    yield Share.update(share, user.token)

    res = yield Share.getInstance(user.token, share._id, student._id)
    assert.equal(res.body._object[0].attachments[0].points.scaled, 0.7)
  })
})
