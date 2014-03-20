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
	}
}