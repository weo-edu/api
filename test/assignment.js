var Seq = require('seq')
  , UserHelper = require('./helpers/user')
  , AssignmentHelper = require('./helpers/assignment')
  , Faker = require('Faker')
  , _ = require('lodash')
  , moment = require('moment');


require('./helpers/boot');

describe('Assignment controller', function() {

  var authToken, teacher, authToken2, student;
  before(function(done) {
    Seq()
      .seq(function() {
        teacher = UserHelper.create(this);
      })
      .seq(function() {
        UserHelper.login(teacher.username, teacher.password, this);
      })
      .seq(function(res) {
        authToken = 'Bearer ' + res.body.token;
        student = UserHelper.create({type: 'student'}, this);
      })
      .seq(function() {
      	UserHelper.login(student.username, student.password, this);
      })
      .seq(function(res) {
      	authToken2 = 'Bearer ' + res.body.token;
      	this();
      })
      .seq(done);
  });

  describe('should create a new assignment', function() {
  	it('when information is entered properly', function(done) {
  		Seq()
  			.seq(function() {
  				AssignmentHelper.create(this)
  			})
  			.seq(function(assignment) {
  				expect(assignment.objective).to.have.property('id');
  				expect(_.keys(assignment.students)).to.have.length(0);
  				this();
  			})
  			.seq(done);
  	});

  	it('when objective is referenced', function(done) {
  		Seq()
      .seq(function() {
        UserHelper.create({}, this);
      })
      .seq(function(res) {
        this.vars.user = res.body;
        request
          .post('/teacher/' + this.vars.user.id + '/group')
          .send({name: Faker.Lorem.words()})
          .end(this);
      })
      .seq(function(res) {
        this.vars.group = res.body;
        this.vars.assignment = AssignmentHelper.generate({teacher: this.vars.user.id, to: this.vars.group.id});
        request.post('/objective')
        	.send(this.vars.assignment.objective)
        	.end(this);
      })
      .seq(function(res) {
      	var objective = res.body;
      	var assignment = this.vars.assignment;
      	assignment.objective = objective.id;
        request.post('/assignment')
          .send(assignment)
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
	      .seq(function() {
	        UserHelper.create({}, this);
	      })
	      .seq(function(res) {
	        this.vars.user = res.body;
	        request
	          .post('/teacher/' + this.vars.user.id + '/group')
	          .send({name: Faker.Lorem.words()})
	          .end(this);
	      })
	      .seq(function(res) {
	        this.vars.group = res.body;
	        var assignment = AssignmentHelper.generate({teacher: this.vars.user.id, to: this.vars.group.id});
	        delete assignment.due_at;
	        request.post('/assignment')
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
	      .seq(function() {
	        UserHelper.create({}, this);
	      })
	      .seq(function(res) {
	        this.vars.user = res.body;
	        request
	          .post('/teacher/' + this.vars.user.id + '/group')
	          .send({name: Faker.Lorem.words()})
	          .end(this);
	      })
	      .seq(function(res) {
	        this.vars.group = res.body;
	        var assignment = AssignmentHelper.generate({teacher: this.vars.user.id, to: this.vars.group.id});
	        assignment.objective = 'doesnotexist';
	        request.post('/assignment')
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
		var group;
		before(function(done) {
			Seq()
				.seq(function() {
					request
	          .post('/teacher/' + teacher.id + '/group')
	          .send({name: Faker.Lorem.words()})
	          .end(this);
				})
				.seq(function(res) {
					group = res.body;
  				request
  					.put('/group/' + group.code + '/members/' + student.id)
  					.end(this);
				})
				.seq(function() {
					var assignment = AssignmentHelper.generate({teacher: teacher.id, to: group.id});
					request.post('/assignment')
						.send(assignment)
						.end(this);
				})
				.seq(function(res) {
					this();
				})
				.seq(done);

		});

		it('when looking by teacher', function(done) {
			Seq()
				.seq(function() {
					request
						.get('/group/' + group.id + '/assignments')
						.set('Authorization', authToken)
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
						.set('Authorization', authToken2)
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
					AssignmentHelper.create(this)
				})
				.seq(function(assignment) {
					this.vars.assignment = assignment;
					request
  					.put('/group/' + this.vars.assignment.to[0] + '/members/' + student.id)
  					.end(this);
				})
				.seq(function(res) {
					var url = '/assignment/' + this.vars.assignment.id;
					request
						.get(url)
						.set('Authorization', authToken2)
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
					AssignmentHelper.create(this)
				})
				.seq(function(assignment) {
					this.vars.assignment = assignment;
					request
  					.put('/group/' + this.vars.assignment.to[0] + '/members/' + student.id)
  					.end(this);
				})
				.seq(function(res) {
					var url = '/assignment/' + this.vars.assignment.id + '/score'
					request
						.patch(url)
						.set('Authorization', authToken2)
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
			var dueDates = [];
			var now = new Date();
			var day = 1000*60*60*24;
			var numDates = 10;
			_.times(numDates, function(n) {
				dueDates.push(new Date(+now + day* n));
			});
			var shuffled = _.shuffle(dueDates);
			Seq()
				.seq(function() {
					UserHelper.create({}, this);
				})
				.seq(function(res) {
					this.vars.user = res.body;
	        request
	          .post('/teacher/' + this.vars.user.id + '/group')
	          .send({name: Faker.Lorem.words()})
	          .end(this);
				})
				.seq(function(res) {
					this.vars.group = res.body;
					var self = this;
					Seq(shuffled)
						.seqEach(function(dueDate) {
							var assignment = AssignmentHelper.generate({teacher: self.vars.user.id, to: self.vars.group.id, due_at: dueDate});
							request.post('/assignment')
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
						.query({to: this.vars.group.id})
						.end(this);
				})
				.seq(function(res) {
					var assignments = res.body;
					expect(assignments).to.have.length(numDates - 1);
					_.each(assignments, function(assignment, idx) {
						expect(assignment.due_at).to.equal(dueDates[idx+1].toISOString());
					});
					done();
				})
			
		});
	});

});