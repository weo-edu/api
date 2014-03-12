var Faker = require('Faker')
	, _ = require('lodash')
  , UserHelper = require('./user');

module.exports = {
	generate: function(opts) {
		opts = opts || {};
    _.defaults(opts, {
      title: Faker.Lorem.words().join(' '),
      type: 'multiple',
      choices: _.times(4, function() {return Faker.Lorem.words().join(' ')})
    });
    return opts;
	}
}