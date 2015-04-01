/**
 * Modules
 */
const compose = require('mu-compose');
const dbUsers = require('co-monk')(require('lib/db').get('users'));
const validator = require('is-my-json-valid');
const slug = require('slug');
const parseName = require('parse-name');
const capitalize = require('capitalize');
const {mapObj, ifElse, identity, toLower, useWith, concat, split, curryN, flip} = require('ramda');

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

/**
 * Vars
 */
const validateUser = validator(schema);
const validate = validateAction(validateUser);


/**
 * Exports
 */
crud(exports, app, dbUsers);

exports.validate = validate;
exports.byUsername = body(dbBy('username', users));

/**
 * Hooks
 */

exports.validating = compose(
  findUsernameLike,
  capitalizeName,
  setDisplayName,
  lowercaseUsername,
  lowercaseEmail
);

exports.saving = compose(
  user.hashPassword
);


const findUsernameLike = ifElse(prop('username'), identity, user.setSimilarUsernameFromEmail);
const setOnboardAddStudents = tap(io(
  user.teachersOf,
  map(byDescriptor(user.setPreference('onboard.add_students', true)))
));

const capitalizeName = converge(assoc('name') compose(mapObj(capitalize), prop('name')), identity);
const setDisplayName = ifElse(prop('displayName'), identity, user.composeDisplayName);

const toLowerSafe = ifElse(identity, toLower, identity);

function lowercaseProp(path) {
  return converge(assoc(path), compose(toLowerSafe, prop(path)), identity);
}

const lowercaseUsername = lowercaseProp('username');
const lowercaseEmail = lowercaseProp('email');