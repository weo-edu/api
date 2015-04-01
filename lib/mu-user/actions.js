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
  hashPassword
);


function *findUsernameLike(next) {
  if(this.state.isNew && this.state.newRecord === )
  yield next;
}
const findUsernameLike = action(['isNew', 'newRecord.username', 'newRecord.email'], 'newRecord.username', function(isNew, useranme, email) {
  return isNew && ! username && email
    ? user.similarUsernameFromEmail(email)
    : username;
});


const setOnboardAddStudents = tap(io(
  user.teachersOf,
  map(byDescriptor(user.setPreference('onboard.add_students', true)))
));

const capitalizeName = action(['newRecord.name'], 'newRecord.name', mapObj(capitalize));

const setDisplayName = action(['newRecord.name', 'newRecord.displayName'], 'newRecord.displayName',
  function(name, displayName) {
  return displayName
    ? displayName
    : user.composeDisplayName(name)
});

const toLowerSafe = ifElse(identity, toLower, identity);
const lowercaseUsername = action(['newRecord.username'], 'newRecord.username', toLowerSafe);
const lowercaseEmail = action(['newRecord.email'], 'newRecord.email', toLowerSafe);

const hash = flip(curryN(2, passwordHash.generate))(config.hash);
const hashPassword = action(['newRecord.password'], 'newRecord.hashedPassword',
  ifElse(identity, user.hashPassword, identity));