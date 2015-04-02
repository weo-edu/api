/**
 * Modules
 */
const ramda = require('ramda');
const compose = require('mu-compose');
const io = require('io');

/**
 * Libs
 */
const {either, assoc, prop, path, evolve, identity} = ramda;
const evolveFrom = require('lib/evolve-from');
const share = require('lib/share');
const objectId = require('lib/objectid');

/**
 * Vars
 */

/**
 * Exports
 */
exports.validating = compose(
  setId,
  setVerb
);

exports.creating = compose(
  addPublicContext
)

exports.saving = compose(
  setInstanceVerb,
  setPublishedAt,
  setChannels,
  setGradedState,
  setStatusChangedAt
);



const setId = evolve({_id: either(identity, objectId)});

const getVerb = either(path(['object', '0', 'attachments', 'verb']), path(['object', 'verb']));
const setVerb = evolveFrom({verb: either(prop('verb'), getVerb)});