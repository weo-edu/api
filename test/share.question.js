/**
 * Imports
 */

var User = require('./helpers/user')
var Group = require('./helpers/group')
var Question = require('./helpers/question')
var Share = require('./helpers/share')
var awaitHooks = require('./helpers/awaitHooks')
var status = require('lib/Share/status')
var matches = require('lodash.matches')
var assert = require('assert')

require('./helpers/boot')

/**
 * Tests
 */

describe('Questions', function() {
  var teacher, student, group

  before(function *() {
    teacher = yield User.createAndLogin()

    student = User.generate({userType: 'student'})
    var password = student.password
    var res = yield User.create({userType: 'student'})
    student = res.body
    res = yield User.login(student.username, password)
    student.token = 'Bearer ' + res.body.token
  })

  beforeEach(function *() {
    group = yield Group.create({}, teacher)
    yield Group.join(group, student)
  })

	it('should create a new share with a question when information is entered properly', function *() {
    var res = yield Question.create(teacher.token, {context: group})
    var assignment = res.body

    assert.equal(assignment.actor.id, teacher.id)
    assert.equal(assignment.verb, 'shared')
    assert(assignment.instances.selfLink.indexOf(assignment._id) > 0)
	})

  it('should answer question when question is formed properly', function *() {
    var res = yield Question.create(teacher.token, {contexts: group.id, channels: ['group!' + group.id + '.board']})
    yield awaitHooks()

    var assignment = res.body
    res = yield Share.getInstance(student.token, assignment._id, student._id)

    var inst = res.body
    var question = inst._object[0].attachments[0]
    assert.equal(question.objectType, 'question')
    question.response = question.attachments[0]._id
    inst.status = status.turnedIn

    yield Share.answer(student.token, inst._id, question._id, question.attachments[0]._id)
    yield Share.turnIn(inst._id, student.token)
    yield awaitHooks()

    res = yield request.get('/share/' + assignment._id)
      .set('Authorization', teacher.token)
      .end()

    var updated = res.body
    assert.equal(updated.instances.total.length, 1)
    var actorsTotal = {}
    var time = updated.instances.total[0].turnedInAt
    actorsTotal[student.id] = {
      actor: {
        displayName: student.displayName,
        id: student.id,
        username: student.username,
        image: {url: student.image.url},
        url: '/' + student.id + '/'
      },
      items: 1,
      pointsScaled: 1,
      status: status.graded,
      turnedInAt: time
    }

    assert(matches({
      context: group.id,
      items: 1,
      status: status.graded,
      pointsScaled: 1,
      actors: actorsTotal,
      turnedInAt: time
    })(updated.instances.total[0]))
  })
})
