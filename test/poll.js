var Seq = require('seq')
  , User = require('./helpers/user')
  , Poll = require('./helpers/poll')
  , Faker = require('Faker')
  , Event = require('./helpers/event');

require('./helpers/boot');

describe('Poll controller', function() {
	var user, group;
	before(function(done) {
		Seq()
			.seq(function() {
				user = User.create(this);
			})
			.seq(function() {
        User.login(user.username, user.password, this);
      })
      .seq(function(res) {
        authToken = 'Bearer ' + res.body.token;
        this();
      })
			.seq(function() {
				request
          .post('/teacher/' + user.id + '/group')
          .send({name: Faker.Lorem.words()})
          .end(this);
			})
			.seq(function(res) {
				group = res.body;
				done();
			});
	});

	it('should create poll form', function(done) {
		Poll.create(user.id, function(err, form) {
			expect(form.id).to.exist;
			expect(form.type).to.equal('poll');
			done();
		});
	});

	it('should assign a form and create a new event', function(done) {
		Seq()
			.seq(function() {
				Poll.assign(user.id, [group.id], this);
			})
			.seq(function(assignRes) {
				this.vars.form = assignRes.form;
				this.vars.assignment = assignRes.assignment;
				Event.feed(user, [group.id], authToken, this);
			})
			.seq(function(res) {
				var feed = res.body;
				var assignmentEvent = feed[0];
				expect(assignmentEvent.actor.id).to.equal(user.id);
				expect(assignmentEvent.object.link).to.equal('/form/' + this.vars.form.id + '/' + this.vars.assignment.id);
				this();
			})
			.seq(done);
	});
});