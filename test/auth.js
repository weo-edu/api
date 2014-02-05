var Seq = require('seq')
  , User = require('./helpers/user.js');

require('./helpers/boot.js');

describe('Auth controller', function() {
  describe('login', function() {
    it('should handle non-existent username', function(done) {
      Seq()
        .seq(function() {
          User.login('badusername', 'test', this);
        })
        .seq(function(res) {
          expect(res).to.have.status(404);
          expect(res.body.message).to.equal('User not found');
          expect(res.body.errors).to.include.something.that.deep.equals({
            resource: 'auth',
            field: 'username',
            code: 'missing'
          });
          this();
        })
        .seq(done);
    });

    it('should handle incorrect password', function(done) {
      Seq()
        .seq(function() {
          this.vars.user = User.create({}, this);
        })
        .seq(function(res) {
          expect(res).to.have.status(201);
          User.login(this.vars.user.username, 'badpass', this);
        })
        .seq(function(res) {
          expect(res).to.have.status(401);
          expect(res.body.message).to.equal('Incorrect password');
          expect(res.body.errors).to.contain.an.item.that.eql({
            resource: 'auth',
            field: 'password',
            code: 'invalid'
          });
          this();
        })
        .seq(done)
        .catch(function(err) { throw err; });
    });

    it('should accept valid credentials', function(done) {
      Seq()
        .seq(function() {
          this.vars.user = User.create({}, this);
        })
        .seq(function(res) {
          expect(res).to.have.status(201);
          var user = this.vars.user;
          User.login(user.username, user.password, this);
        })
        .seq(function(res) {
          expect(res).to.have.status(200);
          expect(res.body).to.have.keys(['token', 'role']);
          this();
        })
        .seq(done)
        .catch(function(err) { throw err; });
    });
  });
});