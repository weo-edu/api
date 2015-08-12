/**
 * Imports
 */
var User = require('./helpers/user')
var Group = require('./helpers/group')
var awaitHooks = require('./helpers/awaitHooks')
var matches = require('lodash.matches')
var assert = require('assert')
var _ = require('lodash')

require('./helpers/boot')

/**
 * Vars
 */
var excluded = ['__v', 'board', 'updatedAt', 'id', 'ownerIds', 'createdAt', 'owners']

/**
 * Tests
 */
describe('Group controller', function () {
  var user
  before(function *() {
    user = yield User.createAndLogin()
  })

  describe('create', function () {
  	it('should create new group and add user to group', function *() {
      var res = yield request
        .post('/group')
        .send(Group.generate())
        .set('Authorization', user.token)
        .end()

      assert.equal(res.status, 201)

      var group = res.body
      res = yield request
      	.get('/' + [user.userType, user.id].join('/'))
        .set('Authorization', user.token)
      	.end()

      assert.equal(res.status, 200)
    	assert(res.body.groups.some(matches({id: group.id})))
  	})

    it('should not allow a student to create a group', function *() {
      var student = yield User.createAndLogin({userType: 'student'})
      var res = yield request
        .post('/group')
        .send(Group.generate())
        .set('Authorization', student.token)
        .end()

      assert.equal(res.status, 403)
    })

    it('should respond with error if name taken', function *() {
      var group = Group.generate()
      var res = yield request
        .post('/group')
        .send(group)
        .set('Authorization', user.token)
        .end()

      assert.equal(res.status, 201)

      res = yield request
        .post('/group')
        .send(Group.generate({displayName: group.displayName}))
        .set('Authorization', user.token)
        .end()

      assert.equal(res.status, 400)
    })
  })

  describe('get', function() {
  	it('should get an object by id', function *() {
      var res = yield request
        .post('/group')
        .send(Group.generate())
        .set('Authorization', user.token)
        .end()

			var group = res.body
			res = yield request
				.get('/group/' + group.id)
        .set('Authorization', user.token)
				.end()

			assert(_.isEqual(_.omit(res.body, excluded), _.omit(group, excluded)))
  	})

  	it('should get a group by id', function *() {
      var res = yield request
        .post('/group')
        .send(Group.generate())
        .set('Authorization', user.token)
        .end()

      var group = res.body
			res = yield request
				.get('/group/' + group.id)
        .set('Authorization', user.token)
				.end()

			assert(_.isEqual(_.omit(res.body, excluded), _.omit(group, excluded)))
  	})
  })

  describe('addMember method', function() {
    var member
    before(function *() {
      var res = yield User.create({userType: 'student'})
      assert.equal(res.status, 201)
      member = res.body
    })

  	it('should add member to existing group', function *() {
      var group = yield Group.create({}, user)
  		var res = yield Group.addMember(group, member.id, user.token)
			assert.equal(res.status, 200)

      res = yield request
        .get('/teacher/' + user.id)
        .set('Authorization', user.token)
        .end()

      assert(res.body.groups.some(matches({id: group.id})))
  	})

  	it('should handle non existent group', function *() {
      var res = yield Group.addMember({id: "535abe6b16213d4e8d331ed1"}, member.id, user.token)
      assert.equal(res.status, 404)
  	})
  })

  describe('join method', function() {
    var student, group
    beforeEach(function *() {
      student = yield User.createAndLogin({userType: 'student'})
      group = yield Group.create({}, user)
    })

    it('join existing group', function *() {
      var res = yield Group.join(group, student)
      assert.equal(res.status, 200)

      res = yield request
        .get('/student/' + student.id)
        .set('Authorization', student.token)
        .end()

        assert(res.body.groups.some(matches({id: group.id})))
    })

    it('should be case insensitive', function *() {
      var group = yield Group.create({}, user)
      assert(/^[a-z0-9]{6,}$/.test(group.code))

      group.code = group.code.toUpperCase()
      res = yield Group.join(group, student)
      assert.equal(res.status, 200)
    })

    it('should handle non existent group', function *() {
      var res = yield request
        .put('/group/join/535abfe3dac02cfe4a7a4f1b')
        .set('Authorization', student.token)
        .end()

      assert.equal(res.status, 404)
    })
  })

  //XXX archive tests
  describe('should archive class', function() {
    var group
    beforeEach(function *() {
      group = yield Group.create({}, user)
    })

    it('when valid id is given', function *() {
      var res = yield request
        .put('/group/' + group.id + '/archive')
        .set('Authorization', user.token)
        .end()

      assert.equal(res.body.status, 'archived')
    })

    it('should update foreign keys', function *() {
      var res = yield request
        .get('/' + user.userType + '/' + user.id)
        .set('Authorization', user.token)
        .end()

      assert.equal(res.status, 200)

      var groups = res.body.groups
      assert(groups.some(matches({
        id: group.id,
        status: 'active'
      })))

      res = yield request
        .put('/group/' + group.id + '/archive')
        .set('Authorization', user.token)
        .end()

      yield awaitHooks()
      yield awaitHooks()
      assert.equal(res.status, 200)

      res = yield request
        .get('/' + user.userType + '/' + user.id)
        .set('Authorization', user.token)
        .end()

      assert.equal(res.status, 200)

      var groups = res.body.groups
      assert(groups.some(matches({
        id: group.id,
        status: 'archived'
      })))
    })
  })
})