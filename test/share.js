/**
 * Imports
 */
var User = require('./helpers/user')
var Share = require('./helpers/share')
var Group = require('./helpers/group')
var GroupModel = require('lib/Group/model')
var access = require('lib/access')
var awaitHooks = require('./helpers/awaitHooks')
var status = require('lib/Share/status')
var assert = require('assert')
var matches = require('lodash.matches')
var _ = require('lodash')

require('./helpers/boot')

/**
 * Tests
 */
describe('Share controller', function() {
  var user, group, board

  before(function *() {
    user = yield User.createAndLogin()
    group = yield Group.create({}, user)
    board = yield Group.createBoard({}, user)
  })

  describe('creating a share', function() {
    it('should populate actor', function *() {
      var res = yield Share.post({}, group, user.token)
      var share = res.body

      assert.equal(res.status, 201)
      assert(share.actor.hasOwnProperty('displayName'))
    })

    it('should not allow the user to set the content field directly', function *() {
      var res = yield Share.post({
        _object: [{
          objectType: 'section',
          attachments: [{
            objectType: 'post',
            originalContent: 'test',
          }]
        }]
      }, group, user.token)

      var share = res.body
      assert.equal(res.status, 201)

      var post = share._object[0].attachments[0]
      var prevContent = post.content
      post.content = 'asdf'

      res = yield Share.update(share, user.token)
      share = res.body
      assert.equal(res.status, 200)
      assert.equal(share._object[0].attachments[0].content, prevContent)
    })

    it('should be copyable', function *() {
      var res = yield Share.post({}, group, user.token)
      var share1 = res.body

      assert.equal(res.status, 201)

      res = yield Share.copy(share1, user.token)

      var share = res.body
      assert.deepEqual(_.omit(share._object[0], 'id'), _.omit(share1._object[0], 'id'))
      assert.notDeepEqual(share.channels, share1.channels)
      assert.notDeepEqual(share.contexts, share1.contexts)
      assert.notEqual(share.id, share1.id)
      assert.deepEqual(share.actor, share1.actor)
    })

    describe('should be copyable', function() {
      var user2

      before(function *() {
        user2 = yield User.createAndLogin()
      })

      it('by other user', function *() {
        var res = yield Share.post({}, group, user.token)
        var share1 = res.body

        assert.equal(res.status, 201)

        res = yield Share.copy(share1, user2.token)

        var share = res.body
        assert.deepEqual(_.omit(share._object[0], 'id'), _.omit(share1._object[0], 'id'))
        assert.notDeepEqual(share.channels, share1.channels)
        assert.notDeepEqual(share.contexts, share1.contexts)
        assert.notEqual(share.id, share1.id)
        assert.notDeepEqual(share.actor, share1.actor)
      })
    })

    it('should be assignable', function *() {
      var res = yield Share.post({}, [], user.token)
      var share = res.body

      assert.equal(res.status, 201)
      assert(share.actor.hasOwnProperty('displayName'))
      assert.equal(share.channels.length, 0)

      res = yield Share.assign(share, [group.id], user.token)
      assert.equal(res.body.channels.length, 1)
    })

    it('should be pinnable', function *() {
      var res = yield Share.post({}, [], user.token)
      var share = res.body

      assert.equal(res.status, 201)
      assert.equal(share.channels.length, 0)
      assert(share.actor.hasOwnProperty('displayName'))

      res = yield Share.pin(share, [board.id], user.token)
      assert.equal(res.body.channels.length, 1)
    })
  })

  describe('posting a share', function() {
    var student

    before(function *() {
      student = yield User.createAndLogin({userType: 'student'})
      yield Group.join(group, student)
    })

    it('should show up in a users feed', function *() {
      var res = yield Share.post({}, group, user.token)
      var share = res.body

      assert.equal(res.status, 201)

      res = yield Share.feed(['group!' + group._id + '.board'], user.token)
      assert.equal(res.status, 200)
      assert(_.isArray(res.body.items))
      assert(res.body.items.some(matches({_id: share._id})))
    })

    it('should list student as member', function *() {
      var res = yield Share.post({}, group, user.token)
      var share = res.body

      res = yield Share.members(share._id, group._id, user.token)
      assert.equal(res.body.items.length, 1)
    })
  })

  describe('reading the feed', function() {
    var user, group

    beforeEach(function *() {
      user = yield User.createAndLogin()
      group = yield Group.create({}, user)
      yield awaitHooks()
    })

    it('should show up in chronological order', function *() {
      var responses = yield _.range(1, 5).map(function() {
        return Share.post({published: true}, group, user.token)
      })

      responses.forEach(function(res) {
        assert.equal(res.status, 201)
      })

      var res = yield Share.feed(['group!' + group._id + '.board'], user.token)
      assert.equal(res.status, 200)
      assert(_.isArray(res.body.items))

      var last = Infinity
      res.body.items.forEach(function(item) {
        var time = + new Date(item.createdAt)
        assert('number' === typeof time)
        assert(time < last)
        last = time
      })
    })

    it('should allow paging', function *() {
      var last = null
      var channel = 'group!' + group._id + '.board'

      yield _.range(0, 5).map(function() {
        return Share.post({}, group, user.token)
      })

      yield awaitHooks()

      var res = yield Share.feed({channel: channel, maxResults: 2}, user.token)
      var shares = res.body.items
      assert.equal(shares.length, 2)
      last = shares[1]

      res = yield Share.feed({
        channel: channel,
        maxResults: 2,
        pageToken: res.body.nextPageToken
      }, user.token)

      shares = res.body.items
      assert.equal(shares.length, 2)
      assert(shares[1]._id !== last._id)

      res = yield Share.feed({
        channel: channel,
        maxResults: 2,
        pageToken: res.body.nextPageToken
      }, user.token)

      shares = res.body.items
      assert.equal(shares.length, 1)
      assert.equal(res.body.nextPageToken, undefined)
    })
  })

  describe('instances', function() {
    var student, student2

    before(function *() {
      student = yield User.createAndLogin({userType: 'student'})
      yield Group.join(group, student)

      student2 = yield User.createAndLogin({userType: 'student'})
      yield Group.join(group, student2)
    })

    it('should create instances for students on share publish', function *() {
      var res = yield Share.post({
        published: true,
        object: {
          objectType: 'section',
          attachments: [{objectType: 'text'}]
        }
      }, group, user.token)

      yield awaitHooks()

      var share = res.body
      res = yield request
        .get('/share/' + share._id)
        .set('Authorization', user.token)
        .end()

      share = res.body
      assert.equal(share.instances.total[0].actors[student._id].status, status.unopened)
      assert.equal(share.instances.total[0].actors[student2._id].status, status.unopened)
    })

    it('should create an opened instance when a student requests it', function *() {
      var res = yield Share.post({description: 'this is a description'}, group, user.token)
      var share = res.body

      res = yield request
        .get('/share/' + share._id + '/instance/' + student._id)
        .set('Authorization', student.token)
        .end()

      var inst = res.body
      assert.equal(inst.description, 'this is a description')
      assert.equal(inst.actor.id, student._id)
      assert.equal(inst.root.id, share._id)
      assert.equal(inst.status, status.opened)

      res = yield request
        .get('/share/' + share._id)
        .set('Authorization', user.token)
        .end()

      share = res.body
      // check status aggregation
      assert.equal(share.instances.total[0].actors[student._id].status, status.opened)
    })

    it('should create an unopened instance when a teacher requests it', function *() {
      var res = yield Share.post({}, group, user.token)
      var share = res.body

      res = yield request
        .get('/share/' + share._id + '/instance/' + student._id)
        .set('Authorization', user.token)
        .end()

      var inst = res.body
      assert.equal(inst.actor.id, student._id)
      assert.equal(inst.root.id, share._id)
      assert.equal(inst.status, status.unopened)
    })

    it('should change from unstarted to pending if a teacher requests it and then the student requests it', function *() {
      var res = yield Share.post({}, group, user.token)
      var share = res.body

      res = yield request
        .get('/share/' + share._id + '/instance/' + student._id)
        .set('Authorization', user.token)
        .end()

      var inst = res.body
      assert.equal(inst.actor.id, student._id)
      assert.equal(inst.root.id, share._id)
      assert.equal(inst.status, status.unopened)

      res = yield request
        .get('/share/' + share._id + '/instance/' + student._id)
        .set('Authorization', student.token)
        .end()

      var inst = res.body
      assert.equal(inst.actor.id, student._id)
      assert.equal(inst.root.id, share._id)
      assert.equal(inst.status, status.opened)
      assert.equal(inst.verb, 'started')
    })

    it('should set the verb to "completed" on turn in', function *() {
      var res = yield Share.post({}, group, user.token)
      var share = res.body

      res = yield request
        .get('/share/' + share._id + '/instance/' + student._id)
        .set('Authorization', student.token)
        .end()

      var inst = res.body
      assert.equal(inst.actor.id, student._id)
      assert.equal(inst.root.id, share._id)
      assert.equal(inst.verb, 'started')

      inst.status = status.turnedIn
      res = yield request
        .put('/share/' + inst._id + '/instance')
        .set('Authorization', student.token)
        .send(inst)
        .end()

      var inst = res.body
      assert.equal(inst.verb, 'completed')

      res = yield request
        .get('/share/' + share._id)
        .set('Authorization', user.token)
        .end()
      share = res.body
      assert.equal(share.instances.total[0].actors[student._id].status, status.graded)
    })

    it('should update share instances on edit', function *() {
      var res = yield Share.post({published: true}, group, user.token)
      var share = res.body

      res = yield request
        .get('/share/' + share._id + '/instance/' + student._id)
        .set('Authorization', student.token)
        .end()

      var inst = res.body
      var tmp = _.clone(share, true)
      tmp.displayName = 'aaaaaaaa'
      tmp._object[0].objectType = 'section'
      tmp._object[0].attachments.push({
        objectType: 'post',
        originalContent: 'test'
      })

      res = yield Share.update(tmp, user.token)
      yield awaitHooks()
      assert.equal(res.status, 200)

      var share2 = res.body
      res = yield request
        .get('/share/' + share._id + '/instance/' + student._id)
        .set('Authorization', student.token)
        .end()

      var inst2 = res.body
      assert(share.displayName !== share2.displayName)
      assert(inst.displayName !== inst2.displayName)
      assert(inst2.displayName === share2.displayName)
      assert(share._object[0].attachments.length !== share2._object[0].attachments.length)
      assert(inst._object[0].attachments.length !== inst2._object[0].attachments.length)
      assert(share._object[0].attachments.length === inst._object[0].attachments.length)
      assert(share2._object[0].attachments.length === inst2._object[0].attachments.length)
    })
  })

  describe('deleting a share', function() {
    it('should succeed for queued shares', function *() {
      var res = yield Share.queue({}, group, user.token)
      var queued = res.body
      assert.equal(res.status, 201)

      res = yield Share.del(queued._id, user.token)
      assert.equal(res.status, 200)
    })
  })

  describe('access', function() {
    var teacher, student, teacherMember, studentMember

    before(function *() {
      teacherMember = user
      student = yield User.createAndLogin({userType: 'student'})
      teacher = yield User.createAndLogin()
      studentMember = yield User.createAndLogin({userType: 'student'})

      yield Group.join(group, studentMember)

      yield [teacher, student, teacherMember, studentMember].map(function(user) {
        return connectUser(user)
      })

      yield [teacher, student, teacherMember, studentMember].map(function(user) {
        return subscribe(user, 'group!' + group._id + '.board')
      })
    })

    describe('post to class', function() {
      var post

      before(function() {
        [teacher, student, teacherMember, studentMember].forEach(function(user) {
          user.messages = []
        })
      })

      before(function *() {
        var res = yield Share.post({}, group, teacherMember.token)
        post = res.body
      })

      it('should not be in teacher feed', function *() {
        yield checkNotInFeed(teacher, group, post)
      })

      it('should be in teacher member feed', function *() {
        yield checkinFeed(teacherMember, group, post)
      })

      it('should be in student member feed', function *() {
        yield checkinFeed(studentMember, group, post)
      })

      it('should not be in student feed', function *() {
        yield checkNotInFeed(student, group, post)
      })

      describe('live updates', function() {
        it('should not appear in teacher feed', function() {
          assert.equal(teacher.messages.length, 0)
        })

        it('should appear in teacher member feed', function() {
          assert.equal(teacherMember.messages.length, 1)
        })

        it('shold appear in student member feed', function() {
          assert.equal(studentMember.messages.length, 1)
        })

        it('should not appear in student feed', function() {
          assert.equal(student.messages.length, 0)
        })
      })
    })

    describe('post to individual', function() {
      var post = null

      before(function() {
        [teacher, student, teacherMember, studentMember].forEach(function(user) {
          user.messages = []
        })
      })

      before(function *() {
        var res = yield Share.post({
          contexts: [{
            descriptor: GroupModel.toAbstractKey(group),
            allow: [
              access.entry('group', 'teacher', GroupModel.toAbstractKey(group)),
              access.entry('user', 'student', {id: studentMember._id})
            ]
          }],
          channels: ['group!' + group._id + '.board']
        }, group, teacherMember.token)

        post = res.body
      })

      it('should not be in teacher feed', function *() {
        yield checkNotInFeed(teacher, group, post)
      })

      it('should be in teacher member feed', function *() {
        yield checkinFeed(teacherMember, group, post)
      })

      it('should be in student member feed', function *() {
        yield checkinFeed(studentMember, group, post)
      })

      it('should not be in student feed', function *() {
        yield checkNotInFeed(student, group, post)
      })

      describe('live updates', function() {
        it('should not appear in teacher feed', function() {
          assert.equal(teacher.messages.length, 0)
        })

        it('should appear in teacher member feed', function() {
          assert.equal(teacherMember.messages.length, 1)
        })

        it('shold appear in student member feed', function() {
          assert.equal(studentMember.messages.length, 1)
        })

        it('should not appear in student feed', function() {
          assert.equal(student.messages.length, 0)
        })
      })
    })
  })
})

function connectUser(user) {
  return (new Promise(function(resolve) {
    var con = socketConnect(user.socketToken)
    con.on('message', function(msg) {
      user.messages.push(msg)
    })
    con.on('connect', function() {
      resolve(con)
    })
    user.con = con
    user.messages = []
  }))
}

function subscribe(user, channel) {
  return (new Promise(function(resolve) {
    user.con.post('/share/subscription', {channel: channel}, function() {
      resolve()
    })
  }))
}

function *checkinFeed(user, group, post) {
  var res = yield Share.feed('group!' + group._id + '.board', user.token)
  assert(res.body.items.some(matches({_id: post._id})))
}

function *checkNotInFeed(user, group, post) {
  var res = yield Share.feed('group!' + group._id + '.board', user.token)
  var shares = res.body.items
  assert((shares || []).every(function(share) {
    return share._id !== post._id
  }))
}
