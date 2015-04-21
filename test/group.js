var Seq = require('seq');
var UserHelper = require('./helpers/user');
var GroupHelper = require('./helpers/group');
var Group = require('lib/Group/model');
var awaitHooks = require('./helpers/awaitHooks');
var _ = require('lodash');

require('./helpers/boot');

var excluded = ['__v', 'board', 'updatedAt', 'id', 'ownerIds', 'createdAt'];

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
          	.get('/' + [user.userType, user.id].join('/'))
            .set('Authorization', user.token)
          	.end(this);
        })
        .seq(function(res) {
          expect(res).to.have.status(200);
        	expect(res.body.groups).to.contain.an.item.with.properties({id: group.id});
        	this();
        })
        .seq(done);
  	});

    it('should not allow a student to create a group', function(done) {
      var student;
      Seq()
        .seq(function() {
          UserHelper.createAndLogin({userType: 'student'}, this);
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
            .send(GroupHelper.generate({displayName: group.displayName}))
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
  				expect(_.omit(res.body, excluded)).to.eql(_.omit(group, excluded));
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
  				expect(_.omit(res.body, excluded)).to.eql(_.omit(group, excluded));
  				this();
  			})
  			.seq(done);
  	});
  });

  describe('addMember method', function() {
    var member;
    before(function(done) {
      Seq()
        .seq(function() {
          UserHelper.create({userType: 'student'}, this);
        })
        .seq(function(res) {
          expect(res).to.have.status(201);
          member = res.body;
          done();
        });
    });

  	it('should add member to existing group', function(done) {
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
  				GroupHelper.addMember(group, member.id, user.token, this);
  			})
  			.seq(function(res) {
  				expect(res).to.have.status(200);
          request
            .get('/teacher/' + user.id)
            .set('Authorization', user.token)
            .end(this);
  			})
  			.seq(function(res) {
  				expect(res.body.groups).to.contain.an.item.with.properties({id: group.id});
  				this();
  			})
  			.seq(done);
  	});

  	it('should handle non existent group', function(done) {
  		Seq()
  			.seq(function() {
          GroupHelper.addMember({id: "535abe6b16213d4e8d331ed1"}, member.id, user.token, this);
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
          UserHelper.createAndLogin({userType: 'student'}, this);
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
          GroupHelper.join(group, student, this);
        })
        .seq(function(res) {
          expect(res).to.have.status(200);
          request
            .get('/student/' + student.id)
            .set('Authorization', student.token)
            .end(this);
        })
        .seq(function(res) {
          expect(res.body.groups).to.contain.an.item.with.properties({id: group.id});
          this();
        })
        .seq(done);
    });

    it('should be case insensitive', function(done) {
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
          expect(res.body.code).to.match(/^[a-z0-9]{6,}$/);

          this.vars.group = res.body;
          request
            .put('/group/join/' + this.vars.group.code.toUpperCase())
            .set('Authorization', student.token)
            .end(this);
        })
        .seq(function(res) {
          expect(res).to.have.status(200);
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
    var group;
    beforeEach(function(done) {
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
          this();
        })
        .seq(done);
    });

    it('when valid id is given', function(done){
      Seq()
        .seq(function() {
          request
            .put('/group/' + group.id + '/archive')
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

    it('should update foreign keys', function(done) {
      Seq()
        .seq(function() {
          request
            .get('/' + user.userType + '/' + user.id)
            .set('Authorization', user.token)
            .end(this);
        })
        .seq(function(res) {
          expect(res).to.have.status(200);

          var groups = res.body.groups;
          expect(groups).to.contain.an.item.with.properties({
            id: group.id,
            status: 'active'
          });

          request
            .put('/group/' + group.id + '/archive')
            .set('Authorization', user.token)
            .end(this);
        })
        .seq(awaitHooks)
        .seq(function(res) {
          expect(res).to.have.status(200);
          request
            .get('/' + user.userType + '/' + user.id)
            .set('Authorization', user.token)
            .end(this);
        })
        .seq(function(res) {
          expect(res).to.have.status(200);

          var groups = res.body.groups;
          expect(groups).to.contain.an.item.with.properties({
            id: group.id,
            status: 'archived'
          });
          this();
        })
        .seq(done);
    })
  });
});