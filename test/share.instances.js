/**
 * Imports
 */
var User = require('./helpers/user')
var Share = require('./helpers/share')
var Group = require('./helpers/group')
var awaitHooks = require('./helpers/awaitHooks')
var assert = require('assert')

require('./helpers/boot')

/**
 * Tests
 */
describe('share instances', function() {
  var teacher, student1, student2, group, channel

  before(function *() {
    var objs = yield User.createTeacherStudentAndGroupAndLogin()
    teacher = objs.teacher
    student1 = objs.student
    group = objs.group

    var res = yield Share.post({
      published: true,
      shareType: 'share',
      _object: [{objectType: 'section'}],
    }, group, teacher.token)

    yield awaitHooks()

    share = res.body
    channel = 'share!' + share.id + '.instances'
  })

  it('should create instances on publish', function *() {
    var res = yield Share.feed(channel, teacher.token)
    assert.equal(res.body.items.length, 1)
  })

  it('should create an instance when a new student joins the class and requests it', function *() {
    var student = yield User.createStudentJoinGroupAndLogin(group)
    var res = yield Share.getInstance(student.token, share.id, student.id)

    assert.equal(res.status, 200)
    var inst = res.body
    assert.equal(inst.actor.id, student.id)
    assert.equal(inst.root.id, share.id)

    res = yield Share.feed(channel, teacher.token)
    assert.equal(res.body.items.length, 2)
  })

  it('should create profile event when share instance is turned in', function *() {
    var res = yield Share.getInstance(student1.token, share.id, student1.id)
    var inst = res.body
    inst.status = 4

    yield Share.updateInstance(inst, student1.token)
    res = yield Share.activities(student1.token, student1.id)
    var activity = res.body.items[0]
    assert.equal(activity.verb, 'turned in')
  })
})