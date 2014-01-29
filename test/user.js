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
          var user = this.vars.user;
          expect(res).to.have.status(201);
          expect(res.body).to.have
            .properties(_.omit(user,
              ['password', 'password_confirmation']));
          expect(res.body).not.to.have.key('password');
          expect(res.body).not.to.have.key('password_confirmation');
          this();
        })
        .seq(function() {
          var user = this.vars.user;
          User.login(user.username, user.password, this);
        })
        .seq(function(res) {
          expect(res).to.have.status(200);
          this();
        })
        .seq(done);
    });

    _.each(['teacher', 'student'], function(type) {
      it('should add type field when creating a ' + type, function(done) {
        Seq()
          .seq(function() {
            request
              .post('/' + type)
              .send(_.omit(User.generate(), 'type'))
              .end(this);
          })
          .seq(function(res) {
            expect(res).to.have.status(201);
            expect(res.body.type).to.equal(type);
            this();
          })
          .seq(done);
      });
    });

    it('should require an email address on a teacher, but not a student',
    function(done) {
      Seq()
        .seq(function() {
          request
            .post('/teacher')
            .send(_.omit(User.generate(), 'email'))
            .end(this);
        })
        .seq(function(res) {
          expect(res).to.have
            .ValidationError('missing_field', 'email', 'teacher',
              {rule: 'required'});
          this();
        })
        .seq(function() {
          request
            .post('/teacher')
            .send(User.generate({email: 'invalidEmail'}))
            .end(this);
        })
        .seq(function(res) {
          expect(res).to.have
            .ValidationError('invalid', 'email', 'teacher', {
              rule: 'email'
            });
          this();
        })
        .seq(done);
    });

    it('should replace a teacher\'s username with their email address', function(done) {
      Seq()
        .seq(function() {
          request
            .post('/teacher')
            .send(User.generate())
            .end(this);
        })
        .seq(function(res) {
          expect(res).to.have.status(201);
          expect(res.body.username).to.equal(res.body.email);
          this();
        })
        .seq(done);
    });

    it('should return an error if you pass type "student" to the teacher endpoint and vice versa',
    function(done) {
      Seq()
        .seq(function() {
          request
            .post('/teacher')
            .send(User.generate({type: 'student', email: 'test@test.com'}))
            .end(this);
        })
        .seq(function(res) {
          expect(res).to.have.ValidationError('invalid', 'type', 'teacher',
            {rule: 'in'});
          this();
        })
        .seq(function() {
          request
            .post('/student')
            .send(User.generate({type: 'teacher', email: 'test@test.com'}))
            .end(this);
        })
        .seq(function(res) {
          expect(res).to.have.ValidationError('invalid', 'type', 'student',
            {rule: 'in'});
          this();
        })
        .seq(done);
    });

    it('should not allow a student with no group', function(done) {
      Seq()
        .seq(function() {
          request
            .post('/student')
            .send(User.generate({type: 'student', groups: []}))
            .end(this);
        })
        .seq(function(res) {
          expect(res).to.have.ValidationError('missing_field', 'groups');
          this();
        })
        .seq(done);
    });

    it.only('should not allow duplicate username', function(done) {
      Seq()
        .seq(function() {
          this.vars.user1 = User.create({}, this);
        })
        .seq(function(res) {
          expect(res).to.have.status(201);
          User.create({username: this.vars.user1.username}, this);
        })
        .seq(function(res) {
          expect(res).to.have.status(401);
          expect(res).to.have
            .ValidationError('already_exists', 'username', 'user', {rule: 'unique'});
          this();
        })
        .seq(done);
    });

    it('should not allow duplicate email', function(done) {
      Seq()
        .seq(function() {
          this.vars.user1 = User.create({}, this);
        })
        .seq(function(res) {
          expect(res).to.have.status(201);
          User.create({email: this.vars.user1.email}, this);
        })
        .seq(function(res) {
          expect(res).to.have.status(401);
          expect(res).to.have
            .ValidationError('already_exists', 'email', 'user', {rule: 'unique'});
          this();
        })
        .seq(done);
    });
  });
});