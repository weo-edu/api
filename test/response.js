var Seq = require('seq')
  , User = require('./helpers/user')
  , Group = require('./helpers/group')
  , Faker = require('Faker');

require('./helpers/boot');

function generate(user, collection) {
  return {
    questionContent: Faker.Lorem.words().join(' '),
    content: Faker.Lorem.words().join(' ')
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
        request
          .post('/group')
          .send(Group.generate())
          .set('Authorization', user.token)
          .end(this);
      })
      .seq(function(res) {
        group = res.body;
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
          .query({board: group.id, channel: '/123/response'})
          .send(generate(user, 'collection'))
          .end(this);
      })
      .seq(function(res) {
        var response = res.body;
        expect(res).to.have.status(201);
        expect(response._object[0]).to.have.property('content');
        expect(response._object[0]).to.have.property('objectType');
        this();
      })
      .seq(done);
  });

});