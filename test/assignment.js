var Seq = require('seq')
  , UserHelper = require('./helpers/user')
  , GroupHelper = require('./helpers/group')
  , AssignmentHelper = require('./helpers/assignment')
  , Faker = require('Faker')
  , _ = require('lodash')
  , moment = require('moment');


require('./helpers/boot');

describe('Assignment controller', function() {

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

  describe('should create a new assignment', function() {
  	it('when information is entered properly', function(done) {
  		Seq()
  			.seq(function() {
          request
            .post('/assignment')
            .send(AssignmentHelper.generate({to: group.id}))
            .set('Authorization', teacherToken)
            .end(this);
  			})
  			.seq(function(res) {
  				expect(res.body.objective).to.have.property('id');
  				expect(_.keys(res.body.students)).to.have.length(0);
  				this();
  			})
  			.seq(done);
  	});

  	it('when objective is referenced', function(done) {
  		Seq()
      .seq(function(res) {
        this.vars.assignment = AssignmentHelper.generate({to: group.id});
        request
          .post('/objective')
        	.send(this.vars.assignment.objective)
          .set('Authorization', teacherToken)
        	.end(this);
      })
      .seq(function(res) {
      	var objective = res.body;
      	var assignment = this.vars.assignment;
      	assignment.objective = objective.id;
        request
          .post('/assignment')
          .send(assignment)
          .set('Authorization', teacherToken)
          .end(this);
      })
      .seq(function(res) {
      	var assignment = res.body;
      	expect(assignment.objective).to.have.property('id');
  			expect(_.keys(assignment.students)).to.have.length(0);
  			this();
      })
      .seq(done);
  	});

		it('when no due date is provided', function(done) {
			Seq()
	      .seq(function(res) {
	        var assignment = AssignmentHelper.generate({to: group.id});
	        delete assignment.due_at;
	        request
            .post('/assignment')
            .set('Authorization', teacherToken)
	          .send(assignment)
	          .end(this);
	      })
	      .seq(function(res) {
	        expect(res.body).to.have.property('due_at');
	        this();
	      })
	      .seq(done)
		})
  });

  describe('should return an error on create new', function() {
  	it('when objective does not exist', function(done) {
  		 Seq()
	      .seq(function(res) {
	        var assignment = AssignmentHelper.generate({to: group.id});
	        assignment.objective = 'doesnotexist';
	        request
            .post('/assignment')
            .set('Authorization', teacherToken)
	          .send(assignment)
	          .end(this);
	      })
	      .seq(function(res) {
	        expect(res).to.have.status(404);
	        expect(res.body.message).to.equal('Objective not found');
          expect(res.body.errors).to.include.something.that.deep.equals({
            resource: 'objective',
            field: 'objective',
            code: 'missing'
          });
	        this();
	      })
	      .seq(done)
  	});
  });

	describe('should find created assignments', function() {
		beforeEach(function(done) {
			Seq()
				.seq(function() {
  				request
            .put('/group/' + group.id + '/members/' + student.id)
            .set('Authorization', teacherToken)
  					.end(this);
				})
				.seq(function() {
					request
            .post('/assignment')
            .set('Authorization', teacherToken)
						.send(AssignmentHelper.generate({to: group.id}))
						.end(this);
				})
        .seq(function() { done(); });
		});

		it('when looking by teacher', function(done) {
			Seq()
				.seq(function() {
					request
						.get('/group/' + group.id + '/assignments')
						.set('Authorization', teacherToken)
						.end(this);
				})
				.seq(function(res) {
					var assignments = res.body;
					expect(assignments).to.have.length(1);
					expect(_.keys(assignments[0].students)).to.have.length(1);
					this();
				})
				.seq(done);
		});

		it('when looking by student', function(done) {
			Seq()
				.seq(function() {
					request
						.get('/group/' + group.id + '/assignments')
						.set('Authorization', studentToken)
						.end(this);
				})
				.seq(function(res) {
					var assignments = res.body;
					expect(assignments).to.have.length(1);

					var assignment = assignments[0];
					expect(_.keys(assignment.students)).to.have.length(0);
					expect(assignment).to.have.property('score');
					expect(assignment).to.have.property('progress');
					expect(assignment).to.have.property('reward_claimed');
					this();
				})
				.seq(done);
		});
	});

	describe('should add student to assignment', function() {
		it('when student is added to group', function(done) {
			Seq()
				.seq(function() {
          request.post('/assignment')
            .set('Authorization', teacherToken)
            .send(AssignmentHelper.generate({to: group.id}))
            .end(this);
				})
				.seq(function(res) {
					this.vars.assignment = res.body;
					request
  					.put('/group/' + this.vars.assignment.to[0] + '/members/' + student.id)
            .set('Authorization', teacherToken)
  					.end(this);
				})
				.seq(function(res) {
          expect(res).to.have.status(200);
					var url = '/assignment/' + this.vars.assignment.id;
					request
						.get(url)
						.set('Authorization', studentToken)
						.end(this);
				})
				.seq(function(res) {
					var assignment = res.body;
					expect(assignment).to.have.property('score');
					this();
				})
				.seq(done);
		});
	});

	describe('should score a student', function() {
		it('when information is entered properly', function(done) {
			Seq()
				.seq(function() {
          request
            .post('/assignment')
            .set('Authorization', teacherToken)
            .send(AssignmentHelper.generate({to: group.id}))
            .end(this);
				})
				.seq(function(res) {
					this.vars.assignment = res.body;
					request
            .put('/group/' + this.vars.assignment.to[0] + '/members/' + student.id)
            .set('Authorization', teacherToken)
  					.end(this);
				})
				.seq(function(res) {
					request
						.patch('/assignment/' + this.vars.assignment.id + '/score')
						.set('Authorization', studentToken)
						.send({score: 5})
						.end(this);
				})
				.seq(function(res) {
					var assignment = res.body;
					expect(assignment.score).to.equal(5);
					expect(assignment.progress).to.equal(1);
					expect(assignment.reward_claimed).to.equal(false);
					this();
				})
				.seq(done);
		});
	});

	describe('should sort assignments', function() {
		it('when adding lots of assignments', function(done) {
			var now = new Date();
			var day = 1000*60*60*24;
			var numDates = 10;
			var dueDates = _.times(numDates, function(n) {
				return new Date(+now + day* n);
			});
			var shuffled = _.shuffle(dueDates);
			Seq()
				.seq(function(res) {
					var self = this;
					Seq(shuffled)
						.seqEach(function(dueDate) {
							var assignment = AssignmentHelper.generate({to: group.id, due_at: dueDate});
							request
                .post('/assignment')
                .set('Authorization', teacherToken)
			          .send(assignment)
			          .end(this);
						})
						.seq(function() {
              self();
            });
				})
				.seq(function() {
					request
						.get('/assignment/active')
            .set('Authorization', studentToken)
						.query({to: group.id})
						.end(this);
				})
				.seq(function(res) {
					var assignments = res.body;
					expect(assignments).to.have.length(numDates - 1);
					_.each(assignments, function(assignment, idx) {
						expect(assignment.due_at).to.equal(dueDates[idx+1].toISOString());
					});
          this();
        })
        .seq(done);
		});
	});

});