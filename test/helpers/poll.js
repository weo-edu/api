var Faker = require('Faker')
  , Form = require('./form')
  , Seq = require('seq')
  , FormSchema = require('../../api/models/Form')
  , Assignment = require('./assignment')
  , moment = require('moment');

module.exports = {
	create: function(creator, cb) {
		Form.create({type: 'poll', creator: creator}, cb);
	},
	assign: function(creator, to, cb) {
		Seq()
			.seq(function() {
				Form.create({creator: creator}, this);
			})
			.seq(function(form) {
				this.vars.form = form;
				var objective = FormSchema.attributes.toObjective.call(form);
				var assignment = Assignment.generate({
					objective: objective,
					due_at: moment(),
					max_score: null,
					reward: null,
					to: to,
					teacher: creator
				});
				request.post('/assignment')
					.send(assignment)
					.end(this);
			})
			.seq(function(res) {
				cb(null, {form: this.vars.form, assignment: res.body});
			});
	}
}