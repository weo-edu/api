var Seq = require('seq')
  , User = require('./helpers/user');

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
  				expect(file.user).to.equal(user.id);
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
  					.end(this);
  			})
  			.seq(function(res) {
  				request
  					.get('/s3/' + this.vars.file.id)
  					.end(this);
  			})
  			.seq(function(res) {
  				var file = res.body;
  				expect(file.completed).to.equal(true);
  				expect(file.base).to.equal('dev.eos.io.s3.amazonaws.com/uploads/');
  				this();
  			})
  			.seq(done);
  	});
  })

});