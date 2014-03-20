var Faker = require('Faker')
  , chai = require('chai')
  , moment = require('moment')
  , Seq = require('seq')
  , UserHelper = require('./user');


var Objective = {
  generate: function(){
    return {
      title: Faker.Lorem.words(),
      body: Faker.Lorem.paragraph(),
    }
  }
};

var Assignment = module.exports = {
  generate: function(opts) {
    opts = opts || {};
    _.defaults(opts, {
      objective: Objective.generate(),
      due_at: moment().add('days', 1),
      max_score: 10,
      reward: 10
    });

    opts.to = [].concat(opts.to);

    return opts;
  }
};