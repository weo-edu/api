var Seq = require('seq')
  , User = require('./helpers/user.js')
  , Event = require('./helpers/event.js');

require('./helpers/boot.js');
describe('Event controller', function() {
  describe('entity validation', function() {
    it('should validate sub-entities', function(done) {
      var evt = Event.generate();
      Seq()
        .seq(function() {
          request
            .post('/event')
            .send(evt)
            .end(this);
        })
        .seq(function(res) {
          expect(res).to.have.status(201);
          delete evt.actor.name;
          request
            .post('/event')
            .send(evt)
            .end(this);
        })
        .seq(function(res) {
          expect(res).to.have.ValidationError('invalid', 'actor');
          this();
        })
        .seq(done);
    });
  });
});