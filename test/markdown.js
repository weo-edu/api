/**
 * Imports
 */
var markdown = require('lib/markdown')
var User = require('./helpers/user')
var Share = require('./helpers/share')
var Group = require('./helpers/group')
var assert = require('assert')

require('./helpers/boot')

/**
 * Tests
 */
describe('Markdown tests', function() {
  var token, group

  before(function *() {
    var user = yield User.createAndLogin()
    token = user.token
    group = yield Group.create({}, user)
  })

  it('should work in post content', function *() {
    var share = Share.generate({}, group)
    share.object = {
      objectType: 'section',
      attachments: [
        {
          objectType: 'post',
          originalContent: '## Title'
        }
      ]
    }

    var res = yield request.post('/share')
      .set('Authorization', token)
      .send(share)

    var share = res.body
    var obj = share._object[0].attachments[0]
    assert.equal(obj.content, '<h2 id=\"md-header-title\">Title</h2>\n')
    assert.equal(obj.displayName, 'Title')
  })

  it('should work for question content', function *() {
    var share = Share.generate({}, group)
    share.object = {
      objectType: 'section',
      attachments: [
        {
          objectType: 'question',
          originalContent: '## Title',
          attachments: [
            {
              objectType: 'text'
            }
          ]
        }
      ]
    }

    var res = yield request.post('/share')
      .set('Authorization', token)
      .send(share)

    var share = res.body
    var obj = share._object[0].attachments[0]
    assert.equal(obj.content, '<h2 id=\"md-header-title\">Title</h2>\n')
    assert.equal(obj.displayName, 'Title')
  })

  it('should render math content', function() {
    assert(markdown('test $2^2$ test').indexOf('katex') === -1)
    assert(markdown('test $$2^2$$ test').indexOf('katex') !== -1)
    assert(markdown('test\n$$\n2^2\n$$\ntest').indexOf('katex') !== -1)
  })

  it('should fail silently on invalid latex', function() {
    assert.equal(markdown('$$ 2 \\plust 2 $$'), '<p>2 \\plust 2</p>\n')
  })

  it('should support lists that start in the middle', function() {
    assert.equal(markdown('2. test'), '<ol start="2">\n<li>test</li>\n</ol>\n')
  })
})
