var Seq = require('seq')
  , UserHelper = require('./helpers/user');

require('./helpers/boot');

describe('Avatar controller', function() {
  describe('unathenticated requests', function() {
    it('should not be allowed', function(done) {
      Seq()
        .seq(function() {
          request
            .patch('/user/avatar')
            .send({image: 'test.jpg'})
            .end(this);
        })
        .seq(function(res) {
          expect(res).to.have.status(401);
          this();
        })
        .seq(done);
    });
  });

  describe('authenticated requests', function() {
    var authToken, teacher, student;
    before(function(done) {
      Seq()
        .seq(function() {
          teacher = UserHelper.create(this);
        })
        .seq(function() {
          UserHelper.login(teacher.username, teacher.password, this);
        })
        .seq(function(res) {
          authToken = 'Bearer ' + res.body.token;
          this();
        })
        .seq(done);
    });

    it('should error if there is no image', function(done) {
      Seq()
        .seq(function() {
          request
            .patch('/user/avatar')
            .set('Authorization', authToken)
            .end(this);
        })
        .seq(function(res) {
          expect(res).to.have.status(400);
          this();
        })
        .seq(done);
    });

    it('should error if an invalid avatar is specified', function(done) {
      Seq()
        .seq(function() {
          request
            .patch('/user/avatar')
            .set('Authorization', authToken)
            .send({image: 'notAValidAvatar'})
            .end(this);
        })
        .seq(function(res) {
          expect(res).to.have.status(404);
          this();
        })
        .seq(done);
    });

    it('should accept a valid avatar path', function(done) {
      Seq()
        .seq(function() {
          request
            .patch('/user/avatar')
            .set('Authorization', authToken)
            .send({image: '/originals/decks/lotus.png'})
            .end(this);
        })
        .seq(function(res) {
          expect(res).to.have.status(204);
          this();
        })
        .seq(done);
    });
  });
});