var supertest = require('supertest-as-promised');
var po = require('@weo-edu/po');
var assert = require('assert');

var app = require('../server');
var request = supertest(app);

describe('Liking', function() {
  var user = null;
  var share = null;
  beforeEach(function(done) {

    po(
      function() {
        return api.createAndLogin(createUser());
      },
      function(u) {
        user = u; 
      },
      function() {
        return api.share(createShare(), user)
      },
      function(res) {
        share = res.body;
      }
    )().then(done).catch(done);

  });


  it('should add self to likers and be listed in likes', function(done) {
    po(
      function() {
        return api.like(share, user);
      },
      function(res) {
        var s = res.body;
        var liker = s.likers[0];
        assert.equal(liker.id, user.id);
      },
      function() {

        return api.likes(user);
      },
      function(res) {
        var likes = res.body.items;
        assert.equal(likes.length, 1);
        assert.equal(likes[0]._id, share.id);
      }
    )().then(done);
  });

  it('should not be possible twice', function(done) {
    po(
      function() {
        return api.like(share, user);
      },
      function(res) {
        var s = res.body;
        var liker = s.likers[0];
        assert.equal(liker.id, user.id);
      },
      function() {
        return api.like(share, user);
      },
      function(res) {
        assert.equal(res.status, 400);
      }
    )().then(done);
  })


  it('should be undoable', function(done) {
    po(
      function() {
        return api.like(share, user);
      },
      function(res) {
        var s = res.body;
        var liker = s.likers[0];
        assert.equal(liker.id, user.id);
        return api.unlike(share, user);
      },
      function(res) {
        var s = res.body;
        var liker = s.likers[0];
        assert.equal(liker.id, user.id);
        return api.likes(user);
      },
      function(res) {
        var likes = res.body.items;
        assert.equal(likes.length, 0);
      }
    )().then(done);
  });

  it('should not be unlikeable', function(done) {
    po(
      function() {
        return api.unlike(share, user);
      },
      function(res) {
        assert.equal(res.status, 400);
      }
    )().then(done);
  })


});


var Faker = require('Faker');

function createUser() {
  return {
    userType: 'teacher',
    name: {
      givenName: sanitize(Faker.Name.firstName()),
      familyName: sanitize(Faker.Name.lastName()),
      honorificPrefix: 'Mr.'
    },
    email: sanitize(Faker.Internet.email()).toLowerCase(),
    username: sanitize(Faker.Internet.userName()),
    password: 'testpassword'
  };
}

function sanitize(str) {
  return str.replace(/[^\s0-9a-zA-Z\@\.]/g, 'a');
}

function createShare() {
  return {
    shareType: 'share',
    verb: 'assigned',
    object: {
      objectType: 'section',
      originalContent: 'Test'
    },
    contexts: [{
      descriptor: {displayName: 'Public', id: 'public', url: '/'},
      allow: [{id: 'public:teacher'}]
    }],
    channels: []
  };
}


var api = {};

api.create = function(user) {
  return request
    .post('/auth/user')
    .send(user);
}


api.createAndLogin = po(api.create, function(res) {
  var user = res.body;
  user.token = 'Bearer ' + user.token;
  return user;
});

api.share = function(share, user) {
  return request
    .post('/share')
    .set('Authorization', user.token)
    .send(share)
}

api.getShare = function(shareId, user) {
  return request
    .get('/share/' + shareId);
}

api.like = function(share, user) {
  return request
    .put('/share/' + share.id + '/like')
    .set('Authorization', user.token);
}

api.unlike = function(share, user) {
  return request
    .put('/share/' + share.id + '/unlike')
    .set('Authorization', user.token);
}

api.likes = function(user) {
  return request
    .get('/user/' + user.id + '/likes');
}





