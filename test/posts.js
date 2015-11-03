/**
 * Imports
 */
var Post = require('./helpers/post')
var User = require('./helpers/user')
var Group = require('./helpers/group')
var hasValidationError = require('./helpers/hasValidationError')
var assert = require('assert')

require('./helpers/boot')

/**
 * Tests
 */
describe('Post controller', function() {
	var teacher, group

	before(function *() {
    teacher = yield User.createAndLogin()
    group = yield Group.create({}, teacher)
  })

	it('should create post', function *() {
  	var res = yield Post.create(teacher.token, 'post', {}, [group])
		var share = res.body
    assert.equal(share._object[0].objectType, 'post')
    assert.equal(share.verb, 'shared')
	})

	it('should create comment', function *() {
		var res = yield Post.create(teacher.token, 'comment', {}, [group])
		var share = res.body
    assert.equal(share._object[0].objectType, 'comment')
    assert.equal(share.verb, 'commented')
	})

	it('when user not authenticated', function *() {
		var share = Post.generate({}, [group])
		var res = yield request
      .post('/share')
      .send(share)

		assert.equal(res.status, 401)
	})

	it('when body is not given', function *() {
		var share = Post.generate({}, [group])
		share.object.originalContent = ''
		var res = yield request
      .post('/share')
      .send(share)
      .set('Authorization', teacher.token)

		assert(hasValidationError(res, '_object.0.originalContent', 'required', 'Path `originalContent` is required.', '', 'originalContent'))
	})
})
