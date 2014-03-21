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

    it('should respond with error if name taken', function(done) {
      var group = GroupHelper.generate();
      Seq()
        .seq(function() {
          request
            .post('/group')
            .send(group)
            .set('Authorization', authToken)
            .end(this);
        })
        .seq(function(res) {
          expect(res).to.have.status(201);
          var group2 = GroupHelper.generate();
          group2.name = group.name;
          request
            .post('/group')
            .send(group2)
            .set('Authorization', authToken)
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

  	it('should get an object by code', function(done) {
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
  					.get('/group/' + group.code)
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

  describe('addMember', function() {
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
  					.put('/group/' + group.code + '/members/' + user.id)
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
  					field: 'code',
  					code: 'missing'
  				});
  				this();
  			})
  			.seq(done);
  	});
  });
});