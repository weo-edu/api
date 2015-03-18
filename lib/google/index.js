var config = require('lib/config');
var google = require('googleapis');
var plus = google.plus('v1');
var drive = google.drive('v2');
var Q = require('q');
var OAuth2 = google.auth.OAuth2;

module.exports = Google;

function Google(oauth2Client) {
  this.client = oauth2Client;
  this.getProfile = Q.nbind(this.getProfile, this);
}

Google.prototype.getProfile = function(cb) {
  plus.people.get({userId: 'me', auth: this.client}, function(err, profile) {
    if(err) return cb(err);
    cb(null, profile);
  });
};

Google.prototype.setDocumentOwner = function(id, newOwner) {
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
  })
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
  return (new Google(client));
};