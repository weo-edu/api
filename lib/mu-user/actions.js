let db = require('lib/db');
let wrap = require('co-monk');
let compose = require('mu-compose');
let users = wrap(db.get('users'));
let diff = require('mongo-update');
let validator = require('is-my-json-valid');
let slug = require('slug');
let validateUser = validator(require('lib/schema-user'));
let similarUsername = require('lib/similar-username');
let parseName = require('parse-name');
let capitalize = require('capitalize');

exports.mutating = function({isNew: isNew}) {
  return function *(id) {
    this.state.isNew = isNew;
    this.state.newRecord = this.body;

    if(! isNew) {
      this.state.originalRecord = yield mu.request(app).get(id);
      this.state.diff = diff(user, this.state.newRecord);
    }
  };
};

exports.validate = function *(){
  var user = this.state.newRecord;
  if(! validateUser(user))
    throw new Error('Invalid user');
};

exports.create = function *() {
  yield users.insert(this.body);
};

exports.byId = function *(id) {
  this.body = yield users.findOne({_id: id});
};

exports.byUsername = function *(username) {
  this.body = yield users.findOne({username: username});
};

exports.update = function *(id) {
  var diff = this.state.diff;
  this.body = yield users.update({_id: id}, diff);
};

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
  hashPassword
);

exports.updating = compose();
exports.creating = compose();
exports.created = compose();

exports.postupdate = compose(
  emitProfileEvent
);

function *findUsernameLike() {
  let username = this.body.username;
  let email = this.body.email;

  if(! username && email) {
    username = slug(email.split('@')[0]);
    this.body.username = yield similarUsername(username);
  }
}

function capitalizeName() {
  let name = this.body.name;

  name.givenName = capitalize(name.givenName);
  name.familyName = capitalize(name.familyName);
}

function *setDisplayName() {
  let displayName = this.body.displayName;

  if(! displayName) {
    this.body.displayName = parseName.compose({
      title: this.name.honorificPrefix,
      first: this.name.givenName,
      last: this.name.familyName
    }, {respectful: true});
  }
}

function *lowercaseUsernameAndEmail() {
  var username = this.body.username;
  var email = this.body.email;

  this.body.username = username && username.toLowerCase();
  this.body.email = email && email.toLowerCase();
}

function *hashPassword() {
  var user = this.state.newRecord;
  var password = this.body.password;
  if(password) {
    delete this.body.password;
    this.body.hashedPassword = passwordHash.generate(this.password, config.hash);
  }
}