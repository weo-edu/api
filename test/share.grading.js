require('./helpers/boot');

var Seq = require('seq');
var User = require('./helpers/user');
var ShareHelper = require('./helpers/share');
var GroupHelper = require('./helpers/group');
var QuestionHelper = require('./helpers/question');
var Group = require('lib/Group/model');
var Cookie = require('cookie');
var access = require('lib/access');
var awaitHooks = require('./helpers/awaitHooks');

describe('grading', function() {
  var user = null;
  var group = null;
  var student = null;
  var student2 = null;

  before(function(done) {
    Seq()
      .seq(function() {
        User.createAndLogin(this);
      })
      .seq(function(u) {
        user = u;
        request
          .post('/group')
          .send(GroupHelper.generate())
          .set('Authorization', user.token)
          .end(this);
      })
      .seq(function(res) {
        expect(res).to.have.status(201);
        group = res.body;
        this();
      })
      .seq(function() {
        User.createAndLogin({userType: 'student'}, this);
      })
      .seq(function(s) {
        student = s;
        GroupHelper.join(group, student, this);
      })
      .seq(function() {
        User.createAndLogin({userType: 'student'}, this);
      })
      .seq(function(s) {
        student2 = s;
        GroupHelper.join(group, student2, this);
      })
      .seq(function() {
        done();
      });
  });

  it('should not destroy prior grades when instances are updated', function(done) {
    var share;

    function getInstance() {
      ShareHelper.getInstance(user.token, share._id, student._id, this);
    }

    function checkScore(res) {
      var inst = res.body;
      expect(inst._object[0].attachments[0].points.scaled).to.equal(0.7);
      this();
    }

    Seq()
      .seq(function() {
        QuestionHelper.create(user.token, {context: group}, this);
      })
      .seq(function(res) {
        share = res.body;
        getInstance.call(this);
      })
      .seq(function setScore(res) {
        var inst = res.body;
        inst._object[0].attachments[0].points.scaled = .7;
        ShareHelper.updateInstance(inst, user.token, this);
      })
      .seq(checkScore)
      .seq(function modifyShare() {
        share.displayName = '111111';
        ShareHelper.updateShare(share, user.token, this);
      })
      .seq(getInstance)
      .seq(checkScore)
      .seq(function() { done(); });
  });
});
