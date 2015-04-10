var config = require('lib/config');
var google = require('googleapis');
var peopleApiUrl = 'https://www.googleapis.com/plus/v1/people/me/openIdConnect';
var plus = google.plus('v1');
var drive = google.drive('v2');
var Q = require('q');
var OAuth2 = google.auth.OAuth2;
var request = require('request');

module.exports = Google;

function Google(oauth2Client, tokens) {
  this.client = oauth2Client;
  this.getProfile = Q.nbind(this.getProfile, this);
  this.tokens = tokens;
}

Google.prototype.getProfile = function(cb) {
  var self = this;
  Google.getUser(this.tokens.access_token, function(err, identity) {
    if(err) return cb(err);
    plus.people.get({userId: 'me', auth: self.client}, function(err, profile) {
      if(err) return cb(err);
      profile.sub = identity.sub;
      cb(null, profile);
    });
  });
};

Google.prototype.setDocumentOwner = function(id) {
  drive.permissions.patch({
    fileId: id,
    permissionId: 'owner',
    transferOwnership: true
  });
};

Google.prototype.getDocumentOwner = function(id, cb) {
  drive.permissions.get({
    fileId: id,
    permissionId: 'owner'
  }, function(err, owner) {
    if(err) return cb(err);
    return cb(null, owner);
  });
};

Google.exchangeCodeForTokens = Q.nbind(function(params, cb) {
  var oauth2Client = new OAuth2(config.googleClientId, config.googleSecret, params.redirectUri);
  oauth2Client.getToken(params.code, function(err, tokens) {
    if(err) return cb(err);
    cb(null, tokens);
  });
}, Google);

Google.authenticated = function(tokens) {
  var client = new OAuth2(config.googleClientId, config.googleSecret);
  client.setCredentials(tokens);
  return (new Google(client, tokens));
};

Google.getUser = function(token, cb) {
  request.get({
    url: peopleApiUrl,
    headers: {Authorization: 'Bearer ' + token},
    json: true
  }, function(err, response, profile) {
    cb(err, profile);
  });
};