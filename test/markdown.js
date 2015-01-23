var markdown = require('lib/markdown');
var UserHelper = require('./helpers/user');
var ShareHelper = require('./helpers/share');
var GroupHelper = require('./helpers/group');
var Seq = require('seq');

require('./helpers/boot');

describe('Markdown tests', function() {
  var token, group;
  before(function(done) {
    Seq()
      .seq(function() {
        UserHelper.createAndLogin(this);
      })
      .seq(function(user) {
        token = user.token;
        GroupHelper.create({}, user, this);
      })
      .seq(function(res) {
        group = res.body;
        this();
      })
      .seq(done);
  });

  it('should work in post content', function(done) {
    Seq()
      .seq(function() {
        var share = ShareHelper.generate({}, group);
        share.object = {
          objectType: 'post',
          originalContent: '## Title'
        };

        request.post('/share')
          .set('Authorization', token)
          .send(share)
          .end(this);
      })
      .seq(function(res) {
        var share = res.body;
        console.log('res', res.body);
        expect(share._object[0].content).to.equal('<h2 id=\"md-header-title\">Title</h2>\n');
        expect(share._object[0].displayName).to.equal('Title');
        this();
      })
      .seq(done);
  });

  it('should work for question content', function(done) {
    Seq()
      .seq(function() {
        var share = ShareHelper.generate({}, group);
        share.object = {
          objectType: 'question',
          originalContent: '## Title',
          attachments: [
            {
              objectType: 'text'
            }
          ]
        };

        request.post('/share')
          .set('Authorization', token)
          .send(share)
          .end(this);
      })
      .seq(function(res) {
        var share = res.body;
        expect(share._object[0].content).to.equal('<h2 id=\"md-header-title\">Title</h2>\n');
        expect(share._object[0].displayName).to.equal('Title');
        this();
      })
      .seq(done);
  });

  it('should render math content', function() {
    expect(markdown('test $2^2$ test')).not.to.contain('katex');
    expect(markdown('test $$2^2$$ test')).to.contain('katex');
    expect(markdown('test\n$$\n2^2\n$$\ntest')).to.contain('katex');
  });

  it('should fail silently on invalid latex', function() {
    expect(markdown('$$ 2 \\plust 2 $$')).to.equal('<p>2 \\plust 2</p>\n');
  });

  it('should support lists that start in the middle', function() {
    expect(markdown('2. test')).to.equal('<ol start="2">\n<li>test</li>\n</ol>\n');
  });
});