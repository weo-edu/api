require('./helpers/boot');

var Seq = require('seq')
var UserHelper = require('./helpers/user')
var GroupHelper = require('./helpers/group');
var QuestionHelper = require('./helpers/question');
var ShareHelper = require('./helpers/share');
var Faker = require('Faker');
var _ = require('lodash');
var moment = require('moment');
var url = require('url');
var awaitHooks = require('./helpers/awaitHooks');

describe('Questions', function() {
  var teacherToken, teacher, student;

  before(function(done) {
    var teacherPassword;
    Seq()
      .seq(function() {
        teacherPassword = UserHelper.create(this).password;
      })
      .seq(function(res) {
        teacher = res.body
        teacher.password = teacherPassword
        UserHelper.login(teacher.username, teacher.password, this);
      })
      .seq(function(res) {
        teacherToken = 'Bearer ' + res.body.token;
        student = UserHelper.create({userType: 'student'}, this);
      })
      .seq(function(res) {
        student = res.body;
      	UserHelper.login(student.username, student.password, this);
      })
      .seq(function(res) {
      	studentToken = 'Bearer ' + res.body.token;
      	this();
      })
      .seq(done);
  });

  var group;
  beforeEach(function(done) {
    Seq()
      .seq(function() {
        request
          .post('/group')
          .set('Authorization', teacherToken)
          .send(GroupHelper.generate())
          .end(this);
      })
      .seq(function(res) {
        group = res.body;
        GroupHelper.join(group, {token: studentToken}, this);
      })
      .seq(function(res) {
        this();
      })
      .seq(done);
  });

  describe('should create a new share with a question', function() {
  	it('when information is entered properly', function(done) {
  		Seq()
  			.seq(function() {
          QuestionHelper.create(teacherToken, {
            context: group
          }, this);
  			})
  			.seq(function(res) {
          var assignment = res.body;
          expect(assignment.actor.id).to.equal(teacher.id);
          expect(assignment.verb).to.equal('shared');
          expect(assignment.instances.selfLink.indexOf(assignment._id)).to.be.greaterThan(0);
  				this();
  			})
  			.seq(done);
  	});
  });

  describe('should answer question', function() {
    var assignment;

    it('when question is formed properly', function(done) {
      Seq()
        .seq(function() {
          QuestionHelper.create(teacherToken, {contexts: group.id, channels: ['group!' + group.id + '.board']}, this);
        })
        .seq(awaitHooks)
        .seq(function(res) {
          assignment = res.body;
          ShareHelper.getInstance(studentToken, assignment._id, student._id, this);
        })
        .seq(function(res) {
          var inst = res.body;
          var question = inst._object[0].attachments[0];
          expect(question.objectType).to.equal('question');
          question.response = question.attachments[0]._id;
          inst.status = 'active';
          ShareHelper.updateInstance(inst, studentToken, this);
        })
        .seq(awaitHooks)
        .seq(function(res) {
          response = res.body;
          request.get('/share/' + assignment._id)
            .set('Authorization', teacherToken)
            .end(this);
        })
        .seq(function(res) {
          var updated = res.body;
          expect(updated.instances.total.length).to.equal(1);
          var actorsTotal = {};
          actorsTotal[student.id] = {
            actor: {
              displayName: student.displayName,
              id: student.id,
              url: '/' + student.id + '/',
              image: {
                url: student.image.url
              }
            },
            items: 1,
            pointsScaled: 1,
            status: 'active'
          };
          var time = updated.instances.total[0].publishedAt;
          expect(updated.instances.total[0]).to.be.like({
            context: group.id,
            items: 1,
            status: 'active',
            pointsScaled: 1,
            actors: actorsTotal,
            publishedAt: time
          });
          this();
        })
        .seq(function() {
          done();
        })
    });
  });
});