var Seq = require('seq')
  , UserHelper = require('./helpers/user')
  , Faker = require('Faker')
  , _ = require('lodash');


require('./helpers/boot');

describe('Group controller', function() {
  describe('create', function(){
  	it('should create new group and add user to group', function(done) {
      Seq()
  			.seq(function() {
  				this.vars.user = UserHelper.create({}, this);
  			})
        .seq(function(res) {
          var user = this.vars.user;
          UserHelper.login(user.username, user.password, this);
        })
        .seq(function(res) {
          this.vars.user.id = res.body.id;
          expect(res).to.have.status(200);
          this.vars.authToken = 'Bearer ' + res.body.token;
          request
            .post('/teacher/' + this.vars.user.id + '/group')
            .send({name: Faker.Lorem.words()})
            .end(this);
        })
        .seq(function(res) {
          expect(res).to.have.status(201);
          this.vars.group = res.body;
          var user = this.vars.user;
          request
          	.get('/' + [user.type, user.id].join('/'))
            .set('Authorization', this.vars.authToken)
          	.end(this)
        })
        .seq(function(res) {
          expect(res).to.have.status(200);
        	expect(res.body.groups).to.contain(this.vars.group.id);
        	this();
        })
        .seq(done);
  	});

  });

  describe('get', function() {
  	it('should get an object by id', function(done) {
  		Seq()
  			.seq(function() {
  				Group.create({name: Faker.Lorem.words()}).done(this)
  			})
  			.seq(function(group) {
  				this.vars.group = group.toJSON();
  				request
  					.get('/group/' + group.id)
  					.end(this);
  			})
  			.seq(function(res) {
  				expect(_.omit(res.body, 'createdAt', 'updatedAt')).to.eql(_.omit(this.vars.group, 'createdAt', 'updatedAt'));
  				this();
  			})
  			.seq(done);
  	});

  	it('should get an object by code', function(done) {
  		Seq()
  			.seq(function() {
  				Group.create({name: Faker.Lorem.words()}).done(this)
  			})
  			.seq(function(group) {
  				this.vars.group = group.toJSON();
  				request
  					.get('/group/' + group.code)
  					.end(this);
  			})
  			.seq(function(res) {
  				expect(_.omit(res.body, 'createdAt', 'updatedAt')).to.eql(_.omit(this.vars.group, 'createdAt', 'updatedAt'));
  				this();
  			})
  			.seq(done);
  	});
  });

  describe('addMember', function() {
  	it('should add member to existing group', function(done) {
  		Seq()
  			.seq(function() {
  				UserHelper.create({}, this);
  			})
  			.seq(function(res) {
  				this.vars.user = res.body;
  				Group.create({name: Faker.Lorem.words()}).done(this)
  			})
  			.seq(function(group) {
  				this.vars.group = group.toJSON();
  				request
  					.put('/group/' + group.code + '/members/' + this.vars.user.id)
  					.end(this);
  			})
  			.seq(function(res) {
  				expect(res).to.have.status(204);
  				User.findOne(this.vars.user.id).done(this);
  			})
  			.seq(function(user) {
  				expect(user.groups).to.contain(this.vars.group.id);
  				this();
  			})
  			.seq(done);
  	});

  	it('should handle non existent group', function(done) {
  		Seq()
  			.seq(function() {
  				UserHelper.create({}, this);
  			})
  			.seq(function(res) {
  				this.vars.user = res.body;
  				request
  					.put('/group/doesntexist/members/' + this.vars.user.id)
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
  })

});