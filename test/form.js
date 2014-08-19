var Seq = require('seq')
  , UserHelper = require('./helpers/user')
  , GroupHelper = require('./helpers/group')
  , FormHelper = require('./helpers/form')
  , Response = require('./helpers/response')
  , Faker = require('Faker')
  , _ = require('lodash')
  , moment = require('moment')
  , url = require('url');

require('./helpers/boot');

describe('Form controller', function() {

  var teacherToken, teacher, studentToken2, student;
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
        student = UserHelper.create({type: 'student'}, this);
      })
      .seq(function() {
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
        this();
      })
      .seq(done);
  });

  describe('should create a new form', function() {
  	it('when information is entered properly', function(done) {
  		Seq()
  			.seq(function() {
          FormHelper.create(teacherToken, 'poll', {
            contexts: group.id,
            channels: ['group!' + group.id + '.board']
          }, this);
  			})
  			.seq(function(res) {
          var assignment = res.body;
          expect(assignment.actor.id).to.equal(teacher.id);
          expect(assignment.verb).to.equal('assigned');
          expect(assignment._object[0].attachments[0].progress.selfLink.indexOf(assignment._object[0]._id)).to.be.greaterThan(0);
          expect(assignment._object[0].attachments[0].attachments[0].progress.selfLink.indexOf(assignment._object[0]._id)).to.be.greaterThan(0);
  				this();
  			})
  			.seq(done);
  	});

  });

  describe('should answer question', function() {
    var assignment, response;
    it('when question is formed properly', function(done) {
      Seq()
        .seq(function() {
          FormHelper.create(teacherToken, 'poll', {contexts: group.id, channels: ['group!' + group.id + '.board']}, this);
        })
        .seq(function(res) {
          assignment = res.body;
          var question = assignment._object[0].attachments[0].attachments[0];
          var channel = url.parse(question.progress.selfLink, true).query.channel;
          Response.create(teacherToken, question, {contexts: group.id, channels: [channel]}, this)
        })
        .seq(function(res) {
          response = res.body;
          request.get('/share/' + assignment._id)
            .set('Authorization', teacherToken)
            .end(this);
        })
        .seq(function(res) {
          var updated = res.body;
          var question = updated._object[0].attachments[0].attachments[0];
          expect(question.progress.total.length).to.equal(1);
          var actorsTotal = {};
          actorsTotal[teacher.id] = {
            actor: {
              displayName: teacher.displayName,
              id: teacher.id,
              url: '/' + teacher.id + '/',
              image: {
                url: teacher.image.url
              }
            },
            progress: 1,
            correct: 1,
            items: 1
          };
          expect(question.progress.total[0]).to.be.like({
            context: group.id,
            progress: 1,
            correct: 1,
            items: 1,
            actors: actorsTotal
          });
          this()
        })
        .seq(function() {
          done();
        })
    });
  });
});