var Faker = require('Faker')
	, _ = require('lodash')
  , FormQuestion = require('./formQuestion');

module.exports = {
	generate: function(opts) {
		opts = opts || {};
    _.defaults(opts, {
      title: Faker.Lorem.words().join(' '),
      creator: Faker.Internet.userName(),
      type: 'poll'
    });
    opts.questions = _.times(opts.questions || 1, function() {
    	return FormQuestion.generate();
    });
    return opts;
	},
	create: function(opts, cb) {
		if('function' === typeof opts) {
      cb = opts;
      opts = {};
    }

    opts = this.generate(opts);
    request
      .post('/form')
      .send(opts)
      .end(function(err, res) {
      	cb(null, res.body);
      });
    return opts;
	}
}