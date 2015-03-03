require('./helpers/boot');

var Seq = require('seq');
var User = require('./helpers/user');
var Share = require('./helpers/share');
var GroupHelper = require('./helpers/group');
var Group = require('lib/Group/model');
var Cookie = require('cookie');
var access = require('lib/access');
var awaitHooks = require('./helpers/awaitHooks');
var status = require('lib/Share/status');

describe('share instances', function() {

  describe('instance creation', function() {
    var teacher = null;
    var student1 = null;
    var student2 = null;
    var group = null;
    var channel;

    before(function(done) {
      Seq()
        .seq(function() {
          User.createTeacherStudentAndGroupAndLogin(this);
        })
        .seq(function(objs) {
          teacher = objs.teacher;
          student1 = objs.student;
          group = objs.group;

          Share.post({
            published: true,
            shareType: 'share',
            _object: [{objectType: 'section'}],
          }, group, teacher.token, this);
        })
        .seq(awaitHooks)
        .seq(function(res) {
          share = res.body;
          channel = 'share!' + share.id + '.instances';
          this();
        })
        .seq(done);
    });

    it('should create instances on publish', function(done) {
      Seq()
        .seq(function(res) {
          Share.feed(channel, teacher.token, this);
        })
        .seq(function(res) {
          var shares = res.body;
          expect(shares.items.length).to.equal(1);
          done();
        });
    });

    it('should create an instance when a new student joins the class and requests it', function(done) {
      var student;
      Seq()
        .seq(function() {
          User.createStudentJoinGroupAndLogin(group, this);
        })
        .seq(function(_student) {
          student = _student;
          Share.getInstance(student.token, share.id, student.id, this);
        })
        .seq(function(res) {
          expect(res.status).to.equal(200);
          var inst = res.body;
          expect(inst.actor.id).to.equal(student.id);
          expect(inst.root.id).to.equal(share.id);
          Share.feed(channel, teacher.token, this);
        })
        .seq(function(res) {
          var shares = res.body;
          expect(shares.items.length).to.equal(2);
          done();
        });
    });

    it('should not create duplicate instances on re-assignment', function(done) {
      var contexts;
      var len;
      Seq()
        .seq(awaitHooks)
        .seq(awaitHooks)
        .seq(function() {
          Share.feed(channel, teacher.token, this);
        })
        .seq(function(res) {
          len = res.body.items.length;

          contexts = share.contexts;
          share.contexts = share.contexts.filter(function(ctx) {
            return ctx.descriptor.id !== 'public';
          });

          Share.updateShare(share, teacher.token, this);
        })
        .seq(function(res) {
          // Make sure we really mutated contexts
          expect(res.body.contexts.length).to.equal(1);

          share.contexts = contexts;
          Share.updateShare(share, teacher.token, this);
        })
        .seq(function() {
          Share.feed(channel, teacher.token, this);
        })
        .seq(function(res) {
          var shares = res.body.items;
          expect(shares.length).to.equal(len);
          done();
        });
    });

    it('should create profile event when share instance is turned in', function(done) {

      Seq()
        .seq(function() {
          Share.getInstance(student1.token, share.id, student1.id, this)
        })
        .seq(function(res) {
          var inst = res.body;
          inst.status = 4;
          Share.updateInstance(inst, student1.token, this);
        })
        .seq(function() {
          Share.activities(student1.token, student1.id, this);
        })
        .seq(function(res) {
          var activity = res.body.items[0];
          expect(activity.verb).to.equal('turned in');
          done();
        });

    });
  });
});