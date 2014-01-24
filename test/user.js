var Seq = require('seq')
  , User = require('./helpers/user.js');

describe('User controller', function() {
  require('./helpers/boot.js')();

  describe('login', function() {
    it('should handle non-existent username', function(done) {
      Seq()
        .seq(function() {
          User.login('badusername', 'test', this);
        })
        .seq(function(res) {
          expect(res).to.have.status(404);
          expect(res.body.message).to.equal('User not found');
          console.log(res.body.errors);
          expect(res.body.errors).to.include.something.that.deep.equals({
            resource: 'user',
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
            resource: 'user',
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
          expect(res.body).to.have.key('token');
          this();
        })
        .seq(done)
        .catch(function(err) { throw err; });
    });
  });

  describe('create', function() {
    it('should validate new user data', function(done) {
      Seq()
        .seq(function() {
          User.create({
            username: 'a',
            type: 'notAValidType'
          }, this);
        })
        .seq(function(res) {
          expect(res).to.have
            .ValidationError('invalid', 'username')
            .and
            .ValidationError('invalid', 'type');
          this();
        })
        .seq(done);
    });

    it('should create a new user and login successfully', function(done) {
      Seq()
        .seq(function() {
          this.vars.user = User.create({}, this);
        })
        .seq(function(res) {
          expect(res).to.have.status(201);
          expect(_.omit(this.vars.user, 'password')).to.be.like(res.body);
          expect(res.body).not.to.have.key('password');
          this();
        })
        .seq(function() {
          User.login(this.vars.username, this.vars.password, this);
        })
        .seq(function(res) {
          expect(res).to.have.status(200);
        })
        .seq(done);
    });
  });
});