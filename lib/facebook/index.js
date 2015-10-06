/**
 * Imports
 */

var config = require('lib/config')
var graph = require('fbgraph')
var Q = require('q')

/**
 * Vars
 */

var get = Q.nbind(graph.get, graph)

/**
 * Facebook
 */

function getAccessToken (code, redirectUri) {
  return get('oauth/access_token?'
    + 'client_id=' + config.facebookClientId
    + '&client_secret=' + config.facebookClientSecret
    + '&code=' + encodeURIComponent(code)
    + '&redirect_uri=' + encodeURIComponent(redirectUri + '/')
  )
}

function getProfile (accessToken) {
  return get('me'
    + '?access_token=' + encodeURIComponent(accessToken)
    + '&fields=id,picture,last_name,first_name,email,name'
  )
}

function getAvatarUrl (id) {
  return 'https://graph.facebook.com/' + id + '/picture?type=large'
}

/**
 * Exports
 */

module.exports = {
  getAccessToken: getAccessToken,
  getProfile: getProfile,
  getAvatarUrl: getAvatarUrl
}
