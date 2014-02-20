var Seq = require('seq')
  , User = require('./helpers/user');


require('./helpers/boot');

describe('User controller', function() {
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

    it('should create a new student and login successfully', function(done) {
      Seq()
        .seq(function() {
          this.vars.user = User.generate({type: 'student'});
          request
            .post('/student')
            .send(this.vars.user)
            .end(this);
        })
        .seq(function(res) {
          var user = this.vars.user;
          expect(res).to.have.status(201);
          expect(res.body).to.have
            .properties(_.omit(user,
              ['password', 'password_confirmation', 'groups']));
          expect(res.body).not.to.have.key('password');
          expect(res.body).not.to.have.key('password_confirmation');
          expect(res.body.groups).to.have.length(1);
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

    it('should create a new teacher and login successfully', function(done) {
      Seq()
        .seq(function() {
          this.vars.user = User.create({type: 'teacher'}, this);
        })
        .seq(function(res) {
          var user = this.vars.user;
          expect(res).to.have.status(201);
          expect(res.body).to.have
            .properties(_.omit(user,
              ['password', 'password_confirmation', 'groups']));
          expect(res.body).not.to.have.key('password');
          expect(res.body).not.to.have.key('password_confirmation');
          expect(res.body.groups).to.have.length(1);
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

    it('should add type field when creating a teacher', function(done) {
      Seq()
        .seq(function() {
          request
            .post('/teacher')
            .send(_.omit(User.generate(), 'type'))
            .end(this);
        })
        .seq(function(res) {
          expect(res).to.have.status(201);
          expect(res.body.type).to.equal('teacher');
          this();
        })
        .seq(done);
    });

    it('should add type field when creating a student', function(done) {
      Seq()
        .seq(function() {
          request
            .post('/student')
            .send(_.omit(User.generate({type: 'student'}), 'type'))
            .end(this);
        })
        .seq(function(res) {
          expect(res).to.have.status(201);
          expect(res.body.type).to.equal('student');
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

    it('should not allow duplicate username', function(done) {
      Seq()
        .seq(function() {
          this.vars.user1 = User.create({}, this);
        })
        .seq(function(res) {
          expect(res).to.have.status(201);
          User.create({username: this.vars.user1.username}, this);
        })
        .seq(function(res) {
          expect(res).to.have.status(400);
          expect(res).to.have
            .ValidationError('already_exists', 'username', 'user', {rule: 'unique'});
          this();
        })
        .seq(done);
    });
  });
});