/**
 * Modules
 */
const compose = require('mu-compose');
const dbUsers = require('co-monk')(require('lib/db').get('users'));
const validator = require('is-my-json-valid');
const slug = require('slug');
const parseName = require('parse-name');
const capitalize = require('capitalize');
const ramda = require('ramda');

/**
 * Libs
 */
const db = require('lib/db-methods');
const app = require('lib/mu-user');
const {byDescriptor} = require('lib/request');
const schema = require('lib/schema-user');
const validateAction = require('lib/action-validate');
const request = require('lib/request');
const crud = require('lib/action-crud');
const maybe = require('lib/maybe');

/**
 * Vars
 */
const {toLower, mapObj, ifElse, identity, toLower, useWith, concat, split, curryN, flip} = ramda;
const maybeToLower = maybe(toLower);
const validateUser = validator(schema);
const validate = validateAction(validateUser);

/**
 * Exports
 */
crud(exports, app, dbUsers);

exports.validate = validate;
exports.byUsername = body(dbBy('username', dbUsers));

/**
 * Hooks
 */

exports.validating = compose(
  findUsernameLike,
  capitalizeName,
  setDisplayName,
  lowercaseUsernameAndEmail
);

exports.saving = compose(
  user.hashPassword
);

const findUsernameLike = either(prop('username'), user.setSimilarUsernameFromEmail);

const setOnboardAddStudents = tap(io(
  user.teachersOf,
  map(byDescriptor(user.setPreference('onboard.add_students', true)))
));

const capitalizeName = evolve({name: mapObj(capitalize});
const setDisplayName = either(prop('displayName'), user.composeDisplayName);
const lowercaseUsernameAndEmail = evolve({
  username: maybeToLower,
  email: maybeToLower
});
