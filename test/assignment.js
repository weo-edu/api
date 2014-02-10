var Seq = require('seq')
  , UserHelper = require('./helpers/user')
  , AssignmentHelper = require('./helpers/assignment')
  , Faker = require('Faker')
  , _ = require('lodash');


require('./helpers/boot');

describe('Assignment controller', function() {


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
        this.vars.assignment = AssignmentHelper.generate({teacher: this.vars.user.id, groups: this.vars.group.id});
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
	        var assignment = AssignmentHelper.generate({teacher: this.vars.user.id, groups: this.vars.group.id});
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

		it('when due date is missing', function(done) {

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
	        var assignment = AssignmentHelper.generate({teacher: this.vars.user.id, groups: this.vars.group.id});
	        delete assignment.due_at;
	        request.post('/assignment')
	          .send(assignment)
	          .end(this);
	      })
	      .seq(function(res) {
	        expect(res).to.have.status(400);
	        expect(res.body.message).to.equal('ValidationError');
          expect(res.body.errors).to.include.something.that.deep.equals({
            resource: 'assignment',
            field: 'due_at',
            code: 'invalid',
            details: {data: null, rule: 'datetime'}
          });
	        this();
	      })
	      .seq(done)
		});
  });

	describe('should find created assignments', function() {
		var teacher, student, group;
		before(function(done) {
			Seq()
				.par(function() {
					UserHelper.create({}, this);
				})
				.par(function() {
					UserHelper.create({type: 'student'}, this);
				})
				.seq(function(teacherRes, studentRes) {
					teacher = teacherRes.body;
					student = studentRes.body;

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
					var assignment = AssignmentHelper.generate({teacher: teacher.id, groups: group.id});
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
						.get('/group/' + group.id + '/assignments/student/' + student.id)
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
					UserHelper.create({type: 'student'}, this);
				})
				.seq(function(res) {
					this.vars.student = res.body;
					request
  					.put('/group/' + this.vars.assignment.groups[0] + '/members/' + this.vars.student.id)
  					.end(this);
				})
				.seq(function(res) {
					var url = '/assignment/' + this.vars.assignment.id + '/student/' + this.vars.student.id;
					request
						.get(url)
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
					UserHelper.create({type: 'student'}, this);
				})
				.seq(function(res) {
					this.vars.student = res.body;
					request
  					.put('/group/' + this.vars.assignment.groups[0] + '/members/' + this.vars.student.id)
  					.end(this);
				})
				.seq(function(res) {
					var url = '/assignment/' + this.vars.assignment.id + '/student/' + this.vars.student.id + '/score';
					request
						.patch(url)
						.send({score: 5})
						.end(this);
				})
				.seq(function(res) {
					var assignment = res.body;
					var assignment_student = assignment.students[this.vars.student.id];
					expect(assignment_student.score).to.equal(5);
					expect(assignment_student.progress).to.equal(1);
					expect(assignment_student.reward_claimed).to.equal(false);
					this();
				})
				.seq(done);
		});
	});

});