var Seq = require('seq')
  , User = require('./helpers/user')
  , Faker = require('Faker');

require('./helpers/boot');

function generate(user, collection) {
  return {
    object: {
      question: Faker.Lorem.words().join(' '),
      answer: Faker.Lorem.words().join(' ')
    }
  };
};

describe('response', function() {
  var user;
  before(function(done) {
    Seq()
      .seq(function() {
        User.createAndLogin(this);
      })
      .seq(function(u) {
        user = u;
        this();
      })
      .seq(done);
  });

  it('should create successfully', function(done) {
    Seq()
      .seq(function() {
        request
          .post('/response')
          .set('Authorization', user.token)
          .send(generate(user, 'collection'))
          .end(this);
      })
      .seq(function(res) {
        var response = res.body;
        expect(res).to.have.status(201);
        expect(response.object).to.have.property('question');
        expect(response.object).to.have.property('answer');
        this();
      })
      .seq(done);
  });

});