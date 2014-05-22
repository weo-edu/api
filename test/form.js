var Seq = require('seq')
  , UserHelper = require('./helpers/user')
  , GroupHelper = require('./helpers/group')
  , AssignmentHelper = require('./helpers/form')
  , Faker = require('Faker')
  , _ = require('lodash')
  , moment = require('moment');

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
          expect(assignment._object[0].attachments[0].progress.selfLink.indexOf('*')).to.be.greaterThan(0);
          expect(assignment._object[0].attachments[0].attachments[0].progress.selfLink.indexOf('*')).to.be.lessThan(0);
  				this();
  			})
  			.seq(done);
  	});

  });

	/*describe('should score a student', function() {
		it('when information is entered properly', function(done) {
			Seq()
				.seq(function() {
          AssignmentHelper.create(teacherToken, 'poll', {board: group.id}, this);
				})
				.seq(function(res) {
					this.vars.assignment = res.body;
					request
            .put('/group/' + group.id + '/members')
            .set('Authorization', studentToken)
  					.end(this);
				})
				.seq(function(res) {
					request
						.patch('/poll/' + this.vars.assignment.id + '/groups/' + group.id + '/score')
						.set('Authorization', studentToken)
						.send({score: 5})
						.end(this);
				})
				.seq(function(res) {
					var result = res.body;
					expect(result.score).to.equal(5);
					expect(result.progress).to.equal(1);
					this();
				})
				.seq(done);
		});
	});*/

});