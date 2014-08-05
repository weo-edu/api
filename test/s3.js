var Seq = require('seq');
var User = require('./helpers/user');


require('./helpers/boot');

describe('S3 controller', function() {
	var authToken
    , user;
  before(function(done) {
    Seq()
      .seq(function() {
        user = User.create(this);
      })
      .seq(function() {
        User.login(user.username, user.password, this);
      })
      .seq(function(res) {
        authToken = 'Bearer ' + res.body.token;
        this();
      })
      .seq(done);
  });

  describe('should create upload', function() {
  	it('when sent proper params and logged in', function(done) {
  		Seq()
  			.seq(function() {
	  			request
	        	.post('/s3/upload')
		        .set('Authorization', authToken)
            .send({name: 'foo.jpg', type: 'image/jpeg'})
		        .end(this);
	  		})
  			.seq(function(res) {
  				var file = res.body;
  				expect(file.name).to.equal('foo.jpg');
  				expect(file.completed).to.equal(false);
  				expect(file.actor.id).to.equal(user.id);
  				expect(file.credential).to.have.property('signature');
  				this();
  			})
  			.seq(done);
  	});

  });

  describe('should create and complete upload', function() {
  	it('when sent proper params and logged in', function(done) {
  		Seq()
  			.seq(function() {
	  			request
	        	.post('/s3/upload')
		        .set('Authorization', authToken)
		        .send({name: 'foo.jpg', type: 'image/jpeg'})
		        .end(this);
	  		})
  			.seq(function(res) {
  				var file = res.body;
  				this.vars.file = file;
  				request
  					.put('/s3/upload/' + file.id + '/complete')
  					.send({base: 's3.amazon.com'})
            .set('Authorization', authToken)
  					.end(this);
  			})
  			.seq(function(res) {
          expect(res).to.have.status(204);
  				request
  					.get('/s3/' + this.vars.file.id)
            .set('Authorization', authToken)
  					.end(this);
  			})
  			.seq(function(res) {
  				var file = res.body;
  				expect(file.completed).to.equal(true);
          // have to use only a partial domain name, otherwise
          // this test will fail in production/ci
  				expect(file.base).to.contain('eos.io.s3.amazonaws.com/uploads/');
  				this();
  			})
  			.seq(done);
  	});
  })

});