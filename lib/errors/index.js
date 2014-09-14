var factory = require('lib/error-factory');

/**
 * Errors types used by the entire application go here
 *
 * Usage:
 *    var errors = require('lib/errors');
 *    next(errors.NotFound('User not found', 'username', req.param('username'));
 *
 * @type {Object}
 */
module.exports = {
  Client: factory('ClientError', 'invalid', {status: 400}),
  Authentication: factory('AuthenticationError', 'authentication', {status: 401}),
  Authorization: factory('AuthorizationError', 'authorization', {status: 403}),
  NotFound: factory('NotFound', 'not_found', {status: 404}),
  Server: factory('ServerError', 'server', {status: 500}),
  OAuthLink: factory('OAuthLinkError', 'oauth_link', {status: 409})
};

