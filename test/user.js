var Seq = require('seq')
  , User = require('./helpers/user.js');

describe('User controller', function() {
  require('./helpers/boot.js')();

  describe('login', function() {
    it('Should handle non-existent username', function(done) {
      request
        .post('/user/login')
        .send({username: 'badusername', password: 'test'})
        .end(function(err, res) {
          expect(res.status).to.equal(404);
          expect(res.body.message).to.equal('User not found');
          expect(res.body.errors).to.be.an('array');
          expect(res.body.errors).to.have.length(1);
          expect(res.body.errors[0]).to.eql({
            resource: 'User',
            field: 'username',
            code: 'missing'
          });
          done();
        });
    });

    it('Should handle incorrect password', function(done) {
      Seq()
        .seq(function() {
          this.vars.user = User.create({}, this);
        })
        .seq(function(res) {
          var user = this.vars.user;
          expect(res.status).to.equal(201);
          request
            .post('/user/login')
            .send({username: user.username, password: 'badpass'})
            .end(this);
        })
        .seq(function(res) {
          expect(res.status).to.equal(401);
          expect(res.body.message).to.equal('Incorrect password');
          expect(res.body.errors).to.be.an('array');
          expect(res.body.errors).to.have.length(1);
          expect(res.body.errors[0]).to.eql({
            resource: 'User',
            field: 'password',
            code: 'invalid'
          });
          done();
        })
        .catch(function(err) { throw err; });
    });

    it('Should accept valid credentials', function(done) {
      Seq()
        .seq(function() {
          this.vars.user = User.create({}, this);
        })
        .seq(function(res) {
          expect(res.status).to.equal(201);
          var user = this.vars.user;
          request
            .post('/user/login')
            .send({username: user.username, password: user.password})
            .end(this);
        })
        .seq(function(res) {
          expect(res.status).to.equal(200);
          expect(res.body.token).to.be.a('string');
          done();
        })
        .catch(function(err) { throw err; });
    });
  });
});