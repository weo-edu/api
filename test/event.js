var Seq = require('seq')
  , User = require('./helpers/user.js');

describe('Event controller', function() {
  require('./helpers/boot.js')();

  describe('entity validation', function() {
    it('should validate sub-entities', function(done) {
      var evt = {
        group_id: 'notARealGroupId',
        created_at: +new Date,
        actor: {
          // Should get validation error because this property
          // is missing
          id: 'testActor',
          name: 'Test Actor',
          url: '/user/testActor'
        },
        verb: 'testing',
        type: 'test',
        object: {
          id: 'testActor',
          name: 'Test Actor',
          url: '/user/testActor'
        },
      };

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