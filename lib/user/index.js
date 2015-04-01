/**
 * Modules
 */
const parseName = require('parse-name');
const validateSchema = require('is-my-json-valid');
const passwordHash = require('password-hash');
const {compose, flip, curryN, concat, map, curry, useWith, split, head} = require('ramda');

/**
 * Libs
 */
const app = require('lib/mu-user');
const request = require('lib/request');
const userSchema = require('lib/schema-user');
const config = require('lib/config');

/**
 * Vars
 */
const {byDescriptor, byId} = request;
const usernameFromEmail = compose(slug, head, split('@'));
const similarUsername = io(compose(get, concat('/similar-username/')));
const similarUsernameFromEmail = compose(similarUsername, usernameFromEmail, prop('email'));

/**
 * Exports
 */
const user = module.exports = request.app(app);

/**
 * Validate a user object against the user schema
 *
 * @param {user} - user
 * @return {Boolean} - valid
 */
user.validate = validateSchema(userSchema);

/**
 * Accepts a user object and returns a new user object
 * with a username field similar to the user portion
 * of the current user object's email address
 *
 * @param {user} - email
 * @return {user} - username
 */
user.setSimilarUsernameFromEmail = converge(io(assoc('username')), similarUsernameFromEmail, identity);

/**
 * Accepts a descriptor (any object that has an id property), and returns
 * the user object corresponding to that id
 *
 * @param {descriptor} - user descriptor
 * @return {user} - user
 */
user.byDescriptor = io(byDescriptor(user.getById));

/**
 * Set a preference value for a particular user
 *
 * @param {String) - path
 * @param {Mixed} - value
 * @param {id} - userId
 */
user.setPreference = io(curry(function(path, value, userId) {
  return put(`/${userId}/preference/${path}`, value);
}));

/**
 * Composes a displayName from its components
 *
 * @param  {Name} - {honorificPrefix: String, givenName: String, familyName: String}
 * @return {String} - displayName
 */
user.composeDisplayName = function(name) {
  return parseName.compose({
    title: name.honorificPrefix,
    first: name.givenName,
    last: name.familyName
  }, {respectful: true});
};

/**
 * Hashes a password
 *
 * @type {String} - password
 * @return {String} - hashed password
 */
user.hashPassword = flip(curryN(2, passwordHash.generate))(config.hash);

user.hashPassword = set('password', password.hash, get('password'));
/**
 * Accepts a user, returns that user's groups
 *
 * @param {user} - user
 * @return {[group]}
 */
user.groupsOf = compose(map(group.byDescriptor), prop('groups'));

/**
 * Takes in a user, and returns an array of that user's
 * teachers (the owners of the groups that the original
 * user belongs to).
 *
 * @param {user}
 * @return {[user]} teachers of the input user
 */
user.teachersOf = io(
  user.groupsOf,
  map(group.ownersOf),
  flatten
);