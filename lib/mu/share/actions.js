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


const isSheet = propEq('shareType', 'share');
const isInstance = propEq('shareType', 'shareInstance');

const isPublished = prop('published');
const isDraft = complement(isPublished);

const setId = evolve({_id: either(identity, objectId)});
const getVerb = either(path(['object', '0', 'attachments', 'verb']), path(['object', 'verb']));
const setVerb = evolveFrom({verb: either(prop('verb'), getVerb)});

const setChannels = ifElse(
  and(isSheet, isNew)
  , ifElse(isDraft, sendToDrafts, sendToClasses)
  , identity);

const setGradedState = ifElse(isInstance,
  cond(
    [both(isTurnedIn, objectIsGraded), setTurnedIn],
    [both(isGraded, complement(objectIsGraded)), setTurnedIn]
    [T, identity]
  ),
  identity
);
