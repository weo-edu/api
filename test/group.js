var Seq = require('seq');
var UserHelper = require('./helpers/user');
var GroupHelper = require('./helpers/group');
var _ = require('lodash');

require('./helpers/boot');

describe('Group controller', function() {
  var user;
  before(function(done) {
    Seq()
      .seq(function() {
        UserHelper.createAndLogin(this);
      })
      .seq(function(teacher) {
        user = teacher;
        this();
      })
      .seq(done);
  });

  describe('create', function(){
  	it('should create new group and add user to group', function(done) {
      var group;
      Seq()
        .seq(function() {
          request
            .post('/group')
            .send(GroupHelper.generate())
            .set('Authorization', user.token)
            .end(this);
        })
        .seq(function(res) {
          expect(res).to.have.status(201);
          group = res.body;
          request
          	.get('/' + [user.type, user.id].join('/'))
            .set('Authorization', user.token)
          	.end(this);
        })
        .seq(function(res) {
          expect(res).to.have.status(200);
        	expect(res.body.groups).to.contain(group.id);
        	this();
        })
        .seq(done);
  	});

    it('should not allow a student to create a group', function(done) {
      var student;
      Seq()
        .seq(function() {
          UserHelper.createAndLogin({type: 'student'}, this);
        })
        .seq(function(student) {
          request
            .post('/group')
            .send(GroupHelper.generate())
            .set('Authorization', student.token)
            .end(this);
        })
        .seq(function(res) {
          expect(res.statusCode).to.equal(403);
          this();
        })
        .seq(done);
    });

    it('should respond with error if name taken', function(done) {
      var group = GroupHelper.generate();
      Seq()
        .seq(function() {
          request
            .post('/group')
            .send(group)
            .set('Authorization', user.token)
            .end(this);
        })
        .seq(function(res) {
          expect(res).to.have.status(201);
          request
            .post('/group')
            .send(GroupHelper.generate({name: group.name}))
            .set('Authorization', user.token)
            .end(this);
        })
        .seq(function(res){
          expect(res).to.have.status(400);
          this();
        })
        .seq(done);
    });
  });

  describe('get', function() {
  	it('should get an object by id', function(done) {
      var group;
  		Seq()
  			.seq(function() {
          request
            .post('/group')
            .send(GroupHelper.generate())
            .set('Authorization', user.token)
            .end(this);
  			})
  			.seq(function(res) {
  				group = res.body;
  				request
  					.get('/group/' + group.id)
            .set('Authorization', user.token)
  					.end(this);
  			})
  			.seq(function(res) {
  				expect(_.omit(res.body, 'createdAt', 'updatedAt')).to.eql(_.omit(group, 'createdAt', 'updatedAt'));
  				this();
  			})
  			.seq(done);
  	});

  	it('should get a group by id', function(done) {
      var group;
  		Seq()
  			.seq(function() {
          request
            .post('/group')
            .send(GroupHelper.generate())
            .set('Authorization', user.token)
            .end(this);
  			})
  			.seq(function(res) {
          group = res.body;
  				request
  					.get('/group/' + group.id)
            .set('Authorization', user.token)
  					.end(this);
  			})
  			.seq(function(res) {
  				expect(_.omit(res.body, 'createdAt', 'updatedAt')).to.eql(_.omit(group, 'createdAt', 'updatedAt'));
  				this();
  			})
  			.seq(done);
  	});
  });

  describe('addMember method', function() {
  	it('should add member to existing group', function(done) {
      var member;
  		Seq()
  			.seq(function() {
  				UserHelper.create({type: 'student'}, this);
  			})
  			.seq(function(res) {
          expect(res).to.have.status(201);
          member = res.body;
          request
            .post('/group')
            .send(GroupHelper.generate())
            .set('Authorization', user.token)
            .end(this);
  			})
  			.seq(function(res) {
          group = res.body;
  				request
  					.put('/group/' + group.id + '/members')
            .set('Authorization', user.token)
  					.end(this);
  			})
  			.seq(function(res) {
  				expect(res).to.have.status(200);
          request
            .get('/teacher/' + user.id)
            .set('Authorization', user.token)
            .end(this);
  			})
  			.seq(function(res) {
  				expect(res.body.groups).to.contain(group.id);
  				this();
  			})
  			.seq(done);
  	});

  	it('should handle non existent group', function(done) {
      var newUser;
  		Seq()
  			.seq(function() {
  				UserHelper.create({}, this);
  			})
  			.seq(function(res) {
  				newUser = res.body;
  				request
  					.put('/group/535abe6b16213d4e8d331ed1/members/' + newUser.id)
            .set('Authorization', user.token)
  					.end(this);
  			})
  			.seq(function(res) {
  				expect(res).to.have.status(404);
  				this();
  			})
  			.seq(done);
  	});
  });

  describe('join method', function() {
    var student, group;
    beforeEach(function(done) {
      Seq()
        .seq(function() {
          UserHelper.createAndLogin({type: 'student'}, this);
        })
        .seq(function(newUser) {
          student = newUser;
          request
            .post('/group')
            .send(GroupHelper.generate())
            .set('Authorization', user.token)
            .end(this);
        })
        .seq(function(res) {
          group = res.body;
          this();
        })
        .seq(done);
    });

    it('join existing group', function(done) {
      Seq()
        .seq(function() {
          request
            .put('/group/join/' + group.code)
            .set('Authorization', student.token)
            .end(this);
        })
        .seq(function(res) {
          expect(res).to.have.status(200);
          request
            .get('/student/' + student.id)
            .set('Authorization', student.token)
            .end(this);
        })
        .seq(function(res) {
          expect(res.body.groups).to.contain(group.id);
          this();
        })
        .seq(done);
    });

    it('should be case sensitive', function(done) {
      Seq()
        .seq(function() {
          // Guarantee our code contains lowercase letters
          // to ensure we're actually testing what we think we are
          var code = 'new code' + (+new Date) + '' + Math.random();
          request
            .post('/group')
            .send(GroupHelper.generate({code: code}))
            .set('Authorization', user.token)
            .end(this);
        })
        .seq(function(res) {
          expect(res).to.have.status(201);
          this.vars.group = res.body;
          request
            .put('/group/join/' + this.vars.group.code.toUpperCase())
            .set('Authorization', student.token)
            .end(this);
        })
        .seq(function(res) {
          expect(res).to.have.status(404);
          this();
        })
        .seq(function() { done(); })
    });

    it('should handle non existent group', function(done) {
      Seq()
        .seq(function() {
          request
            .put('/group/join/535abfe3dac02cfe4a7a4f1b')
            .set('Authorization', student.token)
            .end(this);
        })
        .seq(function(res) {
          expect(res).to.have.status(404);
          this();
        })
        .seq(done);
    });
  });

  //XXX archive tests
  describe('should archive class', function() {
    it('when valid id is given', function(done){
      Seq()
        .seq(function() {
          request
            .post('/group')
            .send(GroupHelper.generate())
            .set('Authorization', user.token)
            .end(this);
        })
        .seq(function(res) {
          var group = res.body;
          expect(group.status).to.equal('active');
          request
            .patch('/group/' + group.id + '/archive')
            .set('Authorization', user.token)
            .end(this);
        })
        .seq(function(res) {
          var group = res.body;
          expect(group.status).to.equal('archived');
          this();
        })
        .seq(done);

    });

  });
});