var Seq = require('seq');
var UserHelper = require('./helpers/user');
var GroupHelper = require('./helpers/group');
var _ = require('lodash');

require('./helpers/boot');

describe('GroupHelper controller', function() {
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
          expect(res).to.have.status(409);
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
  				UserHelper.create(this);
  			})
  			.seq(function(res) {
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
  					.put('/group/' + group.id + '/members/' + member.id)
            .set('Authorization', user.token)
  					.end(this);
  			})
  			.seq(function(res) {
  				expect(res).to.have.status(204);
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
  					.put('/group/doesntexist/members/' + newUser.id)
            .set('Authorization', user.token)
  					.end(this);
  			})
  			.seq(function(res) {
  				expect(res).to.have.status(404);
  				expect(res.body.message).to.equal('Group not found');
  				expect(res.body.errors).to.include.something.that.eql({
  					resource: 'group',
  					field: 'id',
  					code: 'missing'
  				});
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
          expect(res).to.have.status(204);
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
      function invertCase(str) {
        return str.replace(/[a-zA-Z]/g, function(match) {
          if(/[a-z]/.test(match))
            return match.toUpperCase();
          return match.toLowerCase();
        });
      }

      var code = invertCase(group.code);
      Seq()
        .seq(function() {
          request
            .put('/group/join/' + code)
            .set('Authorization', student.token)
            .end(this);
        })
        .seq(function(res) {
          expect(res).to.have.status(404);
          this();
        })
        .seq(done);
    });

    it('should handle non existent group', function(done) {
      Seq()
        .seq(function() {
          request
            .put('/group/join/doesntexist')
            .set('Authorization', student.token)
            .end(this);
        })
        .seq(function(res) {
          expect(res).to.have.status(404);
          expect(res.body.message).to.equal('Group not found');
          expect(res.body.errors).to.include.something.that.eql({
            resource: 'group',
            field: 'code',
            code: 'missing'
          });
          this();
        })
        .seq(done);
    });
  });
});