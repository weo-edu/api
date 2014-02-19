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
  },
  create: function(cb, opts) {
    var self = this;
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
        var assignment = self.generate({teacher: this.vars.user.id, to: this.vars.group.id});
        request.post('/assignment')
          .send(assignment)
          .end(this);
      })
      .seq(function(res) {
        cb(null, res.body);
      })
  }
};