var request = require('request');
var accessTokenUrl = 'https://accounts.google.com/o/oauth2/token';
var peopleApiUrl = 'https://www.googleapis.com/plus/v1/people/me/openIdConnect';
var config = require('lib/config');

exports.getUser = function(options, cb) {
  var params = {
    client_id: options.clientId,
    redirect_uri: options.redirectUri,
    client_secret: config.googleSecret,
    code: options.code,
    grant_type: 'authorization_code'
  };

  request.post(accessTokenUrl, { json: true, form: params }, function(err, response, token) {
    if (token.error) {
      throw new Error(token.error_description);
    }

    var accessToken = token.access_token;
    var headers = {Authorization: 'Bearer ' + accessToken};

    // Step 2. Retrieve profile information about the current user.
    request.get({url: peopleApiUrl, headers: headers, json: true}, function(err, response, profile) {
      cb(err, profile);
    });
  });
};