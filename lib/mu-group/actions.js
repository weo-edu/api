const {converge, call, useWith, map, defaultTo, identity} = require('ramda');
const compose = require('mu-compose');
const group = require('lib/group');
const io = require('io');

exports.validating = compose(
  addAccessCode
);

exports.saving = compose(
  inductOwners,
  archiveSubroups
);


const addAccessCode = evolve({code: converge(defaultTo, group.generateCode, identity)});
const inductOwners = io(
  group.ownersOf,
  converge(call, useWith(map, user.joinGroup), group.ownersOf)
);

const archiveSubgroups = io(
  group.subgroupsOf,
  map(group.archive)
);