var Seq = require('seq')
  , UserHelper = require('./helpers/user')
  , PollHelper = require('./helpers/poll')
  , GroupHelper = require('./helpers/group')
  , Faker = require('Faker')
  , Event = require('./helpers/event');

require('./helpers/boot');

describe('Poll controller', function() {
	var user, group;
	before(function(done) {
		Seq()
			.seq(function() {
				user = UserHelper.create(this);
			})
			.seq(function() {
        UserHelper.login(user.username, user.password, this);
      })
      .seq(function(res) {
        authToken = 'Bearer ' + res.body.token;
        this();
      })
			.seq(function() {
				request
          .post('/group')
          .send(GroupHelper.generate())
          .set('Authorization', authToken)
          .end(this);
			})
			.seq(function(res) {
				group = res.body;
				done();
			});
	});

	it('should create poll form', function(done) {
    Seq()
      .seq(function() {
        request
          .post('/form')
          .set('Authorization', authToken)
          .send(PollHelper.generate())
          .end(this);
      })
      .seq(function(res) {
  			expect(res.body.id).to.exist;
  			expect(res.body.type).to.equal('poll');
        this();
  		})
      .seq(done);
	});

	it('should assign a form and create a new event', function(done) {
		Seq()
			.seq(function() {
				PollHelper.assign(authToken, [group.id], this);
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