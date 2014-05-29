var Seq = require('seq')
  , UserHelper = require('./helpers/user')
  , GroupHelper = require('./helpers/group')
  , AssignmentHelper = require('./helpers/form')
  , Response = require('./helpers/response')
  , Faker = require('Faker')
  , _ = require('lodash')
  , moment = require('moment')
  , url = require('url');

var util = require('util');

require('./helpers/boot');

describe('Form controller', function() {

  var teacherToken, teacher, studentToken2, student;
  before(function(done) {
    Seq()
      .seq(function() {
        teacher = UserHelper.create(this);
      })
      .seq(function() {
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
          AssignmentHelper.create(teacherToken, 'poll', {board: group.id}, this);
  			})
  			.seq(function(res) {
          var assignment = res.body;
          expect(assignment.actor.id).to.equal(teacher.id);
  				expect(_.keys(assignment.payload.students)).to.have.length(0);
          expect(assignment.verb).to.equal('assigned');
          expect(assignment._object[0].attachments[0].progress.selfLink.indexOf(assignment._object[0]._id)).to.be.greaterThan(0);
          expect(assignment._object[0].attachments[0].attachments[0].progress.selfLink.indexOf(assignment._object[0]._id)).to.be.greaterThan(0);
  				this();
  			})
  			.seq(done);
  	});

  });

  var util = require('util');
  describe('should answer question', function() {
    var assignment;
    it('when question is formed properly', function(done) {
      Seq()
        .seq(function() {
          AssignmentHelper.create(teacherToken, 'poll', {board: group.id}, this);
        })
        .seq(function(res) {
          assignment = res.body;
          var question = assignment._object[0].attachments[0].attachments[0];
          var channel = url.parse(question.progress.selfLink, true).query.channel
          Response.create(teacherToken, question, {board: group.id, channel: channel}, this)
        })
        .seq(function(res) {
          request.get('/share/' + assignment._id)
            .set('Authorization', teacherToken)
            .end(this);
        })
        .seq(function(res) {
          var updated = res.body;
          console.log('updated', util.inspect(updated));
          var question = updated._object[0].attachments[0].attachments[0];
          console.log('question', question.progress.total)

          expect(question.progress.total.length).to.equal(1);
          expect(question.progress.total[0]).to.be.like({board: group.id, progress: 1, correct: 1, items: 1});
          this()
        })
        .seq(function() {
          done();
        })
    });

  });

});