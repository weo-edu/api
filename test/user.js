var Seq = require('seq')
  , UserHelper = require('./helpers/user')
  , GroupHelper = require('./helpers/group');


require('./helpers/boot');

describe('User controller', function() {
  describe('create', function() {
    it('should validate new user data', function(done) {
      Seq()
        .seq(function() {
          var user = UserHelper.generate({username: 'a'});
          request
            .post('/user')
            .send(user)
            .end(this);
        })
        .seq(function(res) {
          expect(res).to.have
            .ValidationError('username');
          this();
        })
        .seq(done);
    });

    it('should create a new student and login successfully', function(done) {
      Seq()
        .seq(function() {
          this.vars.user = UserHelper.generate({type: 'student'});
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
          UserHelper.login(user.username, user.password, this);
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
          this.vars.user = UserHelper.create({type: 'teacher'}, this);
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
          UserHelper.login(user.username, user.password, this);
        })
        .seq(function(res) {
          expect(res).to.have.status(200);
          this();
        })
        .seq(done);
    });

    it('should allow login with email address', function(done) {
      Seq()
        .seq(function() {
          this.vars.user = UserHelper.create({type: 'teacher'}, this);
        })
        .seq(function(res) {
          expect(res).to.have.status(201);
          var user = this.vars.user;
          UserHelper.login(user.email, user.password, this);
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
            .send(_.omit(UserHelper.generate(), 'type'))
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
            .send(_.omit(UserHelper.generate({type: 'student'}), 'type'))
            .end(this);
        })
        .seq(function(res) {
          expect(res).to.have.status(201);
          expect(res.body.type).to.equal('student');
          this();
        })
        .seq(done);
    });



    it('should return an error if you pass type "student" to the teacher endpoint and vice versa',
    function(done) {
      Seq()
        .seq(function() {
          var user = UserHelper.generate({type: 'teacher'});
          user.type = 'student';
          request
            .post('/teacher')
            .send(user)
            .end(this);
        })
        .seq(function(res) {
          expect(res.body.type).to.equal('teacher');
          this();
        })
        .seq(function() {
          var user = UserHelper.generate({type: 'student'});
          user.type = 'teacher';
          request
            .post('/student')
            .send(user)
            .end(this);
        })
        .seq(function(res) {
          expect(res.body.type).to.equal('student');
          this();
        })
        .seq(done);
    });

    it('should not allow duplicate username', function(done) {
      Seq()
        .seq(function() {
          this.vars.user1 = UserHelper.create({}, this);
        })
        .seq(function(res) {
          expect(res).to.have.status(201);
          UserHelper.create({username: this.vars.user1.username}, this);
        })
        .seq(function(res) {
          expect(res).to.have.status(400);
          expect(res).to.have
            .ValidationError('username', 'user defined', 'Username already exists');
          this();
        })
        .seq(done);
    });
  });

  describe('groups method', function() {
    var authToken
      , user
      , group;
    before(function(done) {
      Seq()
        .seq(function() {
          user = UserHelper.create({}, this);
        })
        .seq(function(res) {
          UserHelper.login(user.username, user.password, this);
        })
        .seq(function(res) {
          authToken = 'Bearer ' + res.body.token;
          request
            .post('/group')
            .set('Authorization', authToken)
            .send(GroupHelper.generate())
            .end(this);
        })
        .seq(function(res) {
          group = res.body;
          done();
        });
    });

    it('should not allow unauthenticated requests', function(done) {
      Seq()
        .seq(function() {
          request
            .get('/user/groups')
            .end(this);
        })
        .seq(function(res) {
          expect(res).to.have.status(401);
          this();
        })
        .seq(done);
    });

    it('should return the list of groups', function(done) {
      Seq()
        .seq(function() {
          request
            .get('/user/groups')
            .set('Authorization', authToken)
            .end(this);
        })
        .seq(function(res) {
          expect(res).to.have.status(200);
          expect(res.body).to.have.length(1);
          expect(res.body[0]).to.deep.equal(group);
          this();
        })
        .seq(done);
    });
  });

  describe('password reset', function() {
    var student, teacher;
    beforeEach(function(done) {
      Seq()
        .par(function() {
          // Create teacher
          UserHelper.createAndLogin({type: 'teacher'}, this);
        })
        .par(function() {
          // Create student
          UserHelper.createAndLogin({type: 'student'}, this);
        })
        .seq(function(_teacher, _student) {
          // Create a group
          student = _student;
          teacher = _teacher;
          request
            .post('/group')
            .send(GroupHelper.generate())
            .set('Authorization', teacher.token)
            .end(this);
        })
        .seq(function(res) {
          // Join the teacher's group
          expect(res).to.have.status(201);
          var group = res.body;
          request
            .put('/group/join/' + group.code)
            .set('Authorization', student.token)
            .end(this);
        })
        .seq(function(res) {
          expect(res).to.have.status(200);
          done();
        });
    });

    it('should let teachers reset students passwords', function(done) {
      Seq()
        .seq(function() {
          // Set a new password for student, as teacher
          request
            .patch('/student/' + student._id + '/password')
            .send({newPassword: 'new password'})
            .set('Authorization', teacher.token)
            .end(this);
        })
        .seq(function(res) {
          // Try to login with our new password
          expect(res).to.have.status(200);
          UserHelper.login(student.username, 'new password', this);
        })
        .seq(function(res) {
          // Make sure the old password doesn't work
          expect(res).to.have.status(200);
          UserHelper.login(student.username, student.password, this);
        })
        .seq(function(res) {
          expect(res).to.have.status(401);
          this();
        })
        .seq(done);
    });

    it('should not let students set each others passwords', function(done) {
      Seq()
        .seq(function() {
          // Create another student
          UserHelper.createAndLogin({type: 'student'}, this);
        })
        .seq(function(student2) {
          // Make sure student's cannot set each others passwords
          request
            .patch('/student/' + student._id + '/password')
            .send({newPassword: 'other password'})
            .set('Authorization', student2.token)
            .end(this);
        })
        .seq(function(res) {
          // Expect failure
          expect(res).to.have.status(403);
          this();
        })
        .seq(done);
    });

    it('should not let other teachers who do not teach a student set their password', function(done) {
      Seq()
        .seq(function() {
          // Create some other teacher who doesn't teach
          // the student we created in the beforeEach
          UserHelper.createAndLogin({type: 'teacher'}, this);
        })
        .seq(function(otherTeacher) {
          // Attempt to set the student's password as some
          // other teacher who does not own a group that
          // the student belongs to
          request
            .patch('/student/' + student._id + '/password')
            .send({newPassword: 'other password'})
            .set('Authorization', otherTeacher.token)
            .end(this);
        })
        .seq(function(res) {
          // Expect failure
          expect(res).to.have.status(403);
          this();
        })
        .seq(done);
    });
  });
});