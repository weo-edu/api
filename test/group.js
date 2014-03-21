var Seq = require('seq');
var UserHelper = require('./helpers/user');
var GroupHelper = require('./helpers/group');
var Faker = require('Faker');
var _ = require('lodash');


require('./helpers/boot');

describe('GroupHelper controller', function() {
  var user, authToken;
  before(function(done) {
    Seq()
      .seq(function() {
        user = UserHelper.create(this);
      })
      .seq(function(res) {
        UserHelper.login(user.username, user.password, this);
      })
      .seq(function(res) {
        authToken = 'Bearer ' + res.body.token;
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
            .set('Authorization', authToken)
            .end(this);
        })
        .seq(function(res) {
          expect(res).to.have.status(201);
          group = res.body;
          request
          	.get('/' + [user.type, user.id].join('/'))
            .set('Authorization', authToken)
          	.end(this)
        })
        .seq(function(res) {
          expect(res).to.have.status(200);
        	expect(res.body.groups).to.contain(group.id);
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
            .set('Authorization', authToken)
            .end(this);
  			})
  			.seq(function(res) {
  				group = res.body;
  				request
  					.get('/group/' + group.id)
            .set('Authorization', authToken)
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
            .set('Authorization', authToken)
            .end(this);
  			})
  			.seq(function(res) {
          group = res.body;
  				request
  					.get('/group/' + group.id)
            .set('Authorization', authToken)
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
      var user;
  		Seq()
  			.seq(function() {
  				UserHelper.create(this);
  			})
  			.seq(function(res) {
          user = res.body;
          request
            .post('/group')
            .send(GroupHelper.generate())
            .set('Authorization', authToken)
            .end(this);
  			})
  			.seq(function(res) {
          group = res.body;
  				request
  					.put('/group/' + group.id + '/members/' + user.id)
            .set('Authorization', authToken)
  					.end(this);
  			})
  			.seq(function(res) {
  				expect(res).to.have.status(204);
          request
            .get('/teacher/' + user.id)
            .set('Authorization', authToken)
            .end(this);
  			})
  			.seq(function(res) {
  				expect(res.body.groups).to.contain(group.id);
  				this();
  			})
  			.seq(done);
  	});

  	it('should handle non existent group', function(done) {
      var user;
  		Seq()
  			.seq(function() {
  				UserHelper.create({}, this);
  			})
  			.seq(function(res) {
  				user = res.body;
  				request
  					.put('/group/doesntexist/members/' + user.id)
            .set('Authorization', authToken)
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
    it('join existing group', function(done) {
      var user, studentToken;
      Seq()
        .seq(function() {
          UserHelper.createAndLogin({type: 'student'}, this);
        })
        .seq(function(res) {
          user = res.body;
          request
            .post('/group')
            .send(GroupHelper.generate())
            .set('Authorization', authToken)
            .end(this);
        })
        .seq(function(res) {
          group = res.body;
          request
            .put('/group/' + group.code + '/join')
            .set('Authorization', user.token)
            .end(this);
        })
        .seq(function(res) {
          expect(res).to.have.status(204);
          request
            .get('/teacher/' + user.id)
            .set('Authorization', authToken)
            .end(this);
        })
        .seq(function(res) {
          expect(res.body.groups).to.contain(group.id);
          this();
        })
        .seq(done);
    });

    it('should handle non existent group', function(done) {
      var user;
      Seq()
        .seq(function() {
          UserHelper.createAndLogin(this);
        })
        .seq(function(res) {
          request
            .put('/group/doesntexist/join')
            .set('Authorization', res.body.token)
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