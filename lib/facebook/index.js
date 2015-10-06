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
  return get('me?access_token=' + encodeURIComponent(accessToken))
}

function getAvatar (id, accessToken) {
  return get(id + '/picture'
    + '?type=large'
    + '&redirect=false'
    + '&access_token=' + encodeURIComponent(accessToken)
  )
}

/**
 * Exports
 */

module.exports = {
  getAccessToken: getAccessToken,
  getProfile: getProfile,
  getAvatar: getAvatar
}
