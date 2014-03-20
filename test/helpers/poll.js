var Faker = require('Faker')
  , FormHelper = require('./form')
  , Seq = require('seq')
  , FormSchema = require('../../api/models/Form')
  , Assignment = require('./assignment')
  , moment = require('moment');

var PollHelper = module.exports = {
	generate: function(opts) {
		opts = opts || {};
		opts.type = 'poll';
		return FormHelper.generate(opts);
	},
	assign: function(authToken, to, cb) {
		Seq()
			.seq(function() {
				request
					.post('/form')
					.send(PollHelper.generate())
					.set('Authorization', authToken)
					.end(this);
			})
			.seq(function(res) {
				this.vars.form = res.body;
				var objective = FormSchema.attributes.toObjective.call(this.vars.form);
				request
					.post('/assignment')
					.send(Assignment.generate({
						objective: objective,
						due_at: moment(),
						max_score: null,
						reward: null,
						to: to
					}))
					.set('Authorization', authToken)
					.end(this);
			})
			.seq(function(res) {
				cb(null, {form: this.vars.form, assignment: res.body});
			});
	}
}