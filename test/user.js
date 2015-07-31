/**
 * Imports
 */
var User = require('./helpers/user')
var Group = require('./helpers/group')
var hasValidationError = require('./helpers/hasValidationError')
var assert = require('assert')
var _ = require('lodash')
var matches = require('lodash.matches')

require('./helpers/boot')

/**
 * Tests
 */
describe('User controller', function() {
  describe('create', function() {
    it('should validate new user data', function *() {
      var res = yield User.create({email: 'testasdfasdf'})
      assert(hasValidationError(res, 'email'))
    })

    it('should be case-insensitive with respect to usernames', function *() {
      var user = User.generate()
      var res = yield User.create(user)

      delete user.id
      delete user._id

      user.username = user.username.toUpperCase()
      res = yield User.create(user)
      assert(hasValidationError(res, 'username'))

      res = yield User.login(user.username, user.password)
      assert.equal(res.status, 200)
    })

    it('should create a new student and login successfully', function *() {
      var user = User.generate({userType: 'student'})
      var res = yield User.create(user)
      assert.equal(res.status, 201)

      user.username = user.username.toLowerCase()
      var props = _.omit(user, ['password', 'password_confirmation', 'groups'])

      assert(matches(props)(res.body))
      assert(! res.body.hasOwnProperty('password_confirmation'))
      assert(res.body.displayName)

      res = yield User.login(user.username, user.password)
      assert.equal(res.status, 200)
    })

    it('should create a new teacher and login successfully', function *() {
      var user = User.generate({userType: 'teacher'})
      var res = yield User.create(user)
      assert.equal(res.status, 201)

      user.username = user.username.toLowerCase()
      var props = _.omit(user, ['password', 'password_confirmation', 'groups'])

      assert(matches(props)(user))
      assert(! user.hasOwnProperty('password_confirmation'))

      res = yield User.login(user.username, user.password)
      assert.equal(res.status, 200)
    })

    it('should allow login with email address', function *() {
      var user = User.generate({userType: 'teacher'})

      var res = yield User.create(user)
      assert.equal(res.status, 201)

      res = yield User.login(user.email, user.password)
      assert.equal(res.status, 200)
    })

    it('should not allow duplicate usernames', function *() {
      var res = yield User.create()
      var user = res.body

      assert.equal(res.status, 201)

      res = yield User.create({username: user.username})
      assert.equal(res.status, 400)
      assert(hasValidationError(res, 'username', 'unique', 'Username already exists'))
    })

    it('should allow signup with two or one character email addresses', function *() {
      var res = yield User.create({email: email('aa')})
      assert.equal(res.status, 201)

      res = yield User.create({email: email('a')})
      assert.equal(res.status, 201)

      function random(n) {
        return Math.floor(Math.random() * Math.pow(10, n))
      }

      function email(user) {
        return user + '@' + random(8) + '.com'
      }
    })
  })

  describe('groups method', function() {
    var authToken, user, group
    var excluded = ['__v', 'board', 'updatedAt', 'id', 'ownerIds', 'owners']

    before(function *() {
      user = User.generate()
      yield User.create(user)

      var res = yield User.login(user.username, user.password)
      authToken = 'Bearer ' + res.body.token

      group = yield Group.create({}, {token: authToken})
    })

    it('should return the list of groups', function *() {
      var res = yield request
        .get('/user/groups')
        .set('Authorization', authToken)
        .end()

      assert.equal(res.status, 200)
      assert.equal(res.body.items.length, 1)
      assert(_.isEqual(_.omit(res.body.items[0], excluded), _.omit(group, excluded)))
    })

    it('should return the list of classes', function *() {
      var res = yield request
        .get('/user/classes')
        .set('Authorization', authToken)
        .end()

      assert.equal(res.status, 200)
      assert.equal(res.body.items.length, 1)
      assert(_.isEqual(_.omit(res.body.items[0], excluded), _.omit(group, excluded)))
    })

    it('should return the list of boards', function *() {
      var res = yield request
        .get('/user/boards')
        .set('Authorization', authToken)
        .end()

      assert.equal(res.status, 200)
      assert.equal(res.body.items.length, 0)
    })
  })


  describe('board method', function() {
    var authToken, user, group
    var excluded = ['__v', 'board', 'updatedAt', 'id', 'ownerIds', 'owners']

    before(function *() {
      user = User.generate()
      yield User.create(user)

      var res = yield User.login(user.username, user.password)
      authToken = 'Bearer ' + res.body.token

      group = Group.generate()
      delete group.groupType

      res = yield request
        .post('/board')
        .set('Authorization', authToken)
        .send(group)
        .end()

      group = res.body
      assert.equal(res.status, 201)
    })

    it('should return the list of boards', function *() {
      var res = yield request
        .get('/user/boards')
        .set('Authorization', authToken)
        .end()

      assert.equal(res.status, 200)
      assert.equal(res.body.items.length, 1)
      assert(_.isEqual(_.omit(res.body.items[0], excluded), _.omit(group, excluded)))
    })
  })

  describe('password reset', function() {
    var student, teacher

    beforeEach(function *() {
      teacher = yield User.createAndLogin({userType: 'teacher'})
      student = yield User.createAndLogin({userType: 'student'})

      var group = yield Group.create({}, teacher)
      var res = yield request
        .put('/group/join/' + group.code)
        .set('Authorization', student.token)
        .end()

      assert.equal(res.status, 200)
    })

    it('should let teachers reset students passwords and save the cleartext password on the student', function *() {
      // Set a new password for student, as teacher
      var res = yield request
        .put('/student/' + student._id + '/password')
        .send({password: 'new password'})
        .set('Authorization', teacher.token)
        .end()

      // Try to login with our new password
      assert.equal(res.status, 200)

      res = yield User.login(student.username, 'new password')
      // Make sure the old password doesn't work
      assert.equal(res.status, 200)

      res = yield User.login(student.username, student.password)
      assert.equal(res.status, 401)

      res = yield User.login(student.username, 'new password')
      assert.equal(res.status, 200)
      assert.equal(res.body.tmpPassword, 'new password')
    })

    it('should not save the cleartext password when a student or teacher resets their own password', function *() {
      var res = yield request
        .put('/user/' + student._id + '/password')
        .send({password: 'newpass2'})
        .set('Authorization', student.token)
        .end()

      assert.equal(res.status, 200)

      res = yield User.me(student.token)
      assert.equal(!! res.body.tmpPassword, false)

      res = yield request
        .put('/user/' + teacher._id + '/password')
        .send({password: 'newpass2'})
        .set('Authorization', teacher.token)
        .end()

      assert.equal(res.status, 200)

      res = yield User.me(teacher.token)
      assert(! res.body.tmpPassword)
    })

    it('should not let students set each others passwords', function *() {
      var student2 = yield User.createAndLogin({userType: 'student'})

      var res = yield request
        .put('/student/' + student._id + '/password')
        .send({password: 'other password'})
        .set('Authorization', student2.token)
        .end()

      assert.equal(res.status, 403)
    })

    it('should not let other teachers who do not teach a student set their password', function *() {
      // Create some other teacher who doesn't teach
      // the student we created in the beforeEach
      var otherTeacher = yield User.createAndLogin({userType: 'teacher'})

      // Attempt to set the student's password as some
      // other teacher who does not own a group that
      // the student belongs to
      var res = yield request
        .put('/student/' + student._id + '/password')
        .send({password: 'other password'})
        .set('Authorization', otherTeacher.token)
        .end()

      // Expect failure
      assert.equal(res.status, 403)
    })
  })
})