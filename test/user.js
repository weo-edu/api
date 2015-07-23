var Seq = require('seq')
  , UserHelper = require('./helpers/user')
  , GroupHelper = require('./helpers/group')
  , email = require('./helpers/email')


require('./helpers/boot')

describe('User controller', function() {
  describe('create', function() {
    it('should validate new user data', function(done) {
      Seq()
        .seq(function() {
          var user = UserHelper.generate({email: 'testasdfasdf'})
          request
            .post('/auth/user')
            .send(user)
            .end(this)
        })
        .seq(function(res) {
          expect(res).to.have
            .ValidationError('email')
          this()
        })
        .seq(done)
    })

    it('should be case-insensitive with respect to usernames', function(done) {
      var user
      Seq()
        .seq(function() {
          user = UserHelper.generate()
          request
            .post('/auth/user')
            .send(user)
            .end(this)
        })
        .seq(function(res) {
          user.username = user.username.toUpperCase()
          request
            .post('/auth/user')
            .send(user)
            .end(this)
        })
        .seq(function(res) {
          expect(res).to.have.ValidationError('username')
          UserHelper.login(user.username, user.password, this)
        })
        .seq(function(res) {
          expect(res).to.have.status(200)
          this()
        })
        .seq(done)
    })

    it('should create a new student and login successfully', function(done) {
      Seq()
        .seq(function() {
          this.vars.user = UserHelper.generate({userType: 'student'})
          request
            .post('/auth/user')
            .send(this.vars.user)
            .end(this)
        })
        .seq(function(res) {
          var user = this.vars.user
          expect(res).to.have.status(201)
          user.username = user.username.toLowerCase()
          expect(res.body).to.have
            .properties(_.omit(user,
              ['password', 'password_confirmation', 'groups']))
          expect(res.body).not.to.have.key('password_confirmation')
          expect(res.body.displayName).to.exist
          this()
        })
        .seq(function() {
          var user = this.vars.user
          UserHelper.login(user.username, user.password, this)
        })
        .seq(function(res) {
          expect(res).to.have.status(200)
          this()
        })
        .seq(done)
    })

    it('should create a new teacher and login successfully', function(done) {
      Seq()
        .seq(function() {
          this.vars.user = UserHelper.create({userType: 'teacher'}, this)
        })
        .seq(function(res) {
          var user = this.vars.user
          expect(res).to.have.status(201)
          user.username = user.username.toLowerCase()
          expect(res.body).to.have
            .properties(_.omit(user,
              ['password', 'password_confirmation', 'groups']))
          expect(res.body).not.to.have.key('password_confirmation')
          this()
        })
        .seq(function() {
          var user = this.vars.user
          UserHelper.login(user.username, user.password, this)
        })
        .seq(function(res) {
          expect(res).to.have.status(200)
          this()
        })
        .seq(done)
    })

    it('should allow login with email address', function(done) {
      Seq()
        .seq(function() {
          this.vars.user = UserHelper.create({userType: 'teacher'}, this)
        })
        .seq(function(res) {
          expect(res).to.have.status(201)
          var user = this.vars.user
          UserHelper.login(user.email, user.password, this)
        })
        .seq(function(res) {
          expect(res).to.have.status(200)
          this()
        })
        .seq(done)
    })

    it('should not allow duplicate usernames', function(done) {
      Seq()
        .seq(function() {
          this.vars.user1 = UserHelper.create({}, this)
        })
        .seq(function(res) {
          expect(res).to.have.status(201)
          UserHelper.create({username: this.vars.user1.username}, this)
        })
        .seq(function(res) {
          expect(res).to.have.status(400)
          expect(res).to.have
            .ValidationError('username', 'unique', 'Username already exists')
          this()
        })
        .seq(done)
    })

    it('should allow signup with two or one character email addresses', function(done) {
      function random(n) {
        return Math.floor(Math.random() * Math.pow(10, n))
      }

      function email(user) {
        return user + '@' + random(8) + '.com'
      }

      Seq()
        .seq(function() {
          UserHelper.create({email: email('aa')}, this)
        })
        .seq(function(res) {
          expect(res).to.have.status(201)
          UserHelper.create({email: email('a')}, this)
        })
        .seq(function(res) {
          expect(res).to.have.status(201)
          this()
        })
        .seq(done)
    })
  })

  describe('groups method', function() {
    var authToken
      , user
      , group
    before(function(done) {
      Seq()
        .seq(function() {
          user = UserHelper.create({}, this)
        })
        .seq(function(res) {
          UserHelper.login(user.username, user.password, this)
        })
        .seq(function(res) {
          authToken = 'Bearer ' + res.body.token
          request
            .post('/group')
            .set('Authorization', authToken)
            .send(GroupHelper.generate())
            .end(this)
        })
        .seq(function(res) {
          group = res.body
          done()
        })
    })

    it('should return the list of groups', function(done) {
      Seq()
        .seq(function() {
          request
            .get('/user/groups')
            .set('Authorization', authToken)
            .end(this)
        })
        .seq(function(res) {
          expect(res).to.have.status(200)
          expect(res.body.items).to.have.length(1)
          var excluded = ['__v', 'board', 'updatedAt', 'id', 'ownerIds', 'owners']
          expect(_.omit(res.body.items[0], excluded)).to.deep.equal(_.omit(group, excluded))
          this()
        })
        .seq(done)
    })

    it('should return the list of classes', function(done) {
      Seq()
        .seq(function() {
          request
            .get('/user/classes')
            .set('Authorization', authToken)
            .end(this)
        })
        .seq(function(res) {
          expect(res).to.have.status(200)
          expect(res.body.items).to.have.length(1)
          var excluded = ['__v', 'board', 'updatedAt', 'id', 'ownerIds', 'owners']
          expect(_.omit(res.body.items[0], excluded)).to.deep.equal(_.omit(group, excluded))
          this()
        })
        .seq(done)
    })

    it('should return the list of boards', function(done) {
      Seq()
        .seq(function() {
          request
            .get('/user/boards')
            .set('Authorization', authToken)
            .end(this)
        })
        .seq(function(res) {
          expect(res).to.have.status(200)
          expect(res.body.items).to.have.length(0)
          this()
        })
        .seq(done)
    })
  })


  describe('board method', function() {
    before(function(done) {
      Seq()
        .seq(function() {
          user = UserHelper.create({}, this)
        })
        .seq(function(res) {
          UserHelper.login(user.username, user.password, this)
        })
        .seq(function(res) {
          authToken = 'Bearer ' + res.body.token
          var group = GroupHelper.generate()
          delete group.groupType
          request
            .post('/board')
            .set('Authorization', authToken)
            .send(group)
            .end(this)
        })
        .seq(function(res) {
          group = res.body
          done()
        })
    })

    it('should return the list of boards', function(done) {
      Seq()
        .seq(function() {
          request
            .get('/user/boards')
            .set('Authorization', authToken)
            .end(this)
        })
        .seq(function(res) {
          expect(res).to.have.status(200)
          expect(res.body.items).to.have.length(1)
          var excluded = ['__v', 'board', 'updatedAt', 'id', 'ownerIds', 'owners']
          expect(_.omit(res.body.items[0], excluded)).to.deep.equal(_.omit(group, excluded))
          this()
        })
        .seq(done)
    })
  })

  var cheerio = require('cheerio')
  var ent = require('ent')
  var url = require('url')

  describe('password reset', function() {
    var student, teacher
    beforeEach(function(done) {
      Seq()
        .par(function() {
          // Create teacher
          UserHelper.createAndLogin({userType: 'teacher'}, this)
        })
        .par(function() {
          // Create student
          UserHelper.createAndLogin({userType: 'student'}, this)
        })
        .seq(function(_teacher, _student) {
          // Create a group
          student = _student
          teacher = _teacher
          request
            .post('/group')
            .send(GroupHelper.generate())
            .set('Authorization', teacher.token)
            .end(this)
        })
        .seq(function(res) {
          // Join the teacher's group
          expect(res).to.have.status(201)
          var group = res.body
          request
            .put('/group/join/' + group.code)
            .set('Authorization', student.token)
            .end(this)
        })
        .seq(function(res) {
          expect(res).to.have.status(200)
          done()
        })
    })

    it('should let teachers reset students passwords and save the cleartext password on the student', function(done) {
      Seq()
        .seq(function() {
          // Set a new password for student, as teacher
          request
            .put('/student/' + student._id + '/password')
            .send({password: 'new password'})
            .set('Authorization', teacher.token)
            .end(this)
        })
        .seq(function(res) {
          // Try to login with our new password
          expect(res).to.have.status(200)
          UserHelper.login(student.username, 'new password', this)
        })
        .seq(function(res) {
          // Make sure the old password doesn't work
          expect(res).to.have.status(200)
          UserHelper.login(student.username, student.password, this)
        })
        .seq(function(res) {
          expect(res).to.have.status(401)
          UserHelper.login(student.username, 'new password', this)
        })
        .seq(function(res) {
          expect(res).to.have.status(200)
          expect(res.body.tmpPassword).to.equal('new password')
          this()
        })
        .seq(done)
    })

    it('should not save the cleartext password when a student or teacher resets their own password', function(done) {
      Seq()
        .seq(function() {
          request
            .put('/user/' + student._id + '/password')
            .send({password: 'newpass2'})
            .set('Authorization', student.token)
            .end(this)
        })
        .seq(function(res) {
          expect(res.status).to.equal(200)
          UserHelper.me(student.token, this)
        })
        .seq(function(res) {
          expect(!! res.body.tmpPassword).to.equal(false)
          this()
        })
        .seq(function() {
          request
            .put('/user/' + teacher._id + '/password')
            .send({password: 'newpass2'})
            .set('Authorization', teacher.token)
            .end(this)
        })
        .seq(function(res) {
          expect(res.status).to.equal(200)
          UserHelper.me(teacher.token, this)
        })
        .seq(function(res) {
          expect(!! res.body.tmpPassword).to.equal(false)
          this()
        })
        .seq(done)
    })

    it('should not let students set each others passwords', function(done) {
      Seq()
        .seq(function() {
          // Create another student
          UserHelper.createAndLogin({userType: 'student'}, this)
        })
        .seq(function(student2) {
          // Make sure student's cannot set each others passwords
          request
            .put('/student/' + student._id + '/password')
            .send({password: 'other password'})
            .set('Authorization', student2.token)
            .end(this)
        })
        .seq(function(res) {
          // Expect failure
          expect(res).to.have.status(403)
          this()
        })
        .seq(done)
    })

    it('should not let other teachers who do not teach a student set their password', function(done) {
      Seq()
        .seq(function() {
          // Create some other teacher who doesn't teach
          // the student we created in the beforeEach
          UserHelper.createAndLogin({userType: 'teacher'}, this)
        })
        .seq(function(otherTeacher) {
          // Attempt to set the student's password as some
          // other teacher who does not own a group that
          // the student belongs to
          request
            .put('/student/' + student._id + '/password')
            .send({password: 'other password'})
            .set('Authorization', otherTeacher.token)
            .end(this)
        })
        .seq(function(res) {
          // Expect failure
          expect(res).to.have.status(403)
          this()
        })
        .seq(done)
    })
  })
})