var Seq = require('seq')
  , UserHelper = require('./helpers/user')

require('./helpers/boot')

//XXX test avatar created when user is created

describe('Avatar controller', function() {
  describe('unathenticated requests', function() {
    it('should not be allowed', function(done) {
      Seq()
        .seq(function() {
          request
            .put('/avatar')
            .send({url: 'test.jpg'})
            .end(this)
        })
        .seq(function(res) {
          expect(res).to.have.status(401)
          this()
        })
        .seq(done)
    })
  })

  describe('authenticated requests', function() {
    var authToken, teacher, student
    before(function(done) {
      Seq()
        .seq(function() {
          teacher = UserHelper.create(this)
        })
        .seq(function(res) {
          UserHelper.login(teacher.username, teacher.password, this)
        })
        .seq(function(res) {
          authToken = 'Bearer ' + res.body.token
          this()
        })
        .seq(done)
    })

    it('should error if there is no image', function(done) {
      Seq()
        .seq(function() {
          request
            .put('/avatar')
            .set('Authorization', authToken)
            .end(this)
        })
        .seq(function(res) {
          expect(res).to.have.status(400)
          this()
        })
        .seq(done)
    })

    it('should accept a valid avatar path', function(done) {
      Seq()
        .seq(function() {
          request
            .put('/avatar')
            .set('Authorization', authToken)
            .send({url: 'https://www.weo.io/originals/decks/lotus.png'})
            .end(this)
        })
        .seq(function(res) {
          expect(res).to.have.status(200)
          done()
        })
    })
  })
})