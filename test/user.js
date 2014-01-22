describe('test', function() {
  require('./helpers/boot.js')();
  it('test2', function(done) {
    request
      .post('/user/login')
      .send({username: 'josh', password: 'test'})
      .end(function(err, res) {
        done();
      });
  });
});