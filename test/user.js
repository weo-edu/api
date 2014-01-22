describe('User controller', function() {
  require('./helpers/boot.js')();

  describe('login', function() {
    it('Should handle non-existent username', function(done) {
      request
        .post('/user/login')
        .send({username: 'badusername', password: 'test'})
        .end(function(err, res) {
          var status = res.status
            , body = res.body;

          expect(status).to.equal(404);
          expect(body.message).to.equal('User not found');
          expect(body.errors).to.be.an('array');
          expect(body.errors).to.have.length(1);
          expect(body.errors[0]).to.equal({
            resource: 'User',
            field: 'username',
            code: 'missing'
          });
        });
    });
  });
});