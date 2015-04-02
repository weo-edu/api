/**
 * Modules
 */
const ramda = require('ramda');
const compose = require('mu-compose');
const io = require('io');

/**
 * Libs
 */
const group = require('lib/group');

/**
 * Vars
 */
const {converge, call, useWith, map, defaultTo, identity} = ramda;


/**
 * Exports
 */

exports.validating = compose(
  addAccessCode
);

exports.saving = compose(
  inductOwners,
  archiveSubroups
);


const addAccessCode = evolve({code: either(identity, group.generateCode)});
const inductOwners = io(
  group.ownersOf,
  converge(call, useWith(map, user.joinGroup), group.ownersOf)
);

const archiveSubgroups = io(
  group.subgroupsOf,
  map(group.archive)
);