const create = require('lib/create');
const update = require('lib/update');
const compose = require('mu-compose');
const body = require('action').body;

module.exports = function(actions, app, collection) {
  actions.setupCreate = create.setup();
  actions.create = create.execute(collection);

  actions.setupUpdate = update.setup(app);
  actions.update = update.execute(collection);

  actions.getById = body(db.findOneById(collection));
  actions.delById = body(db.removeById(collection));

  // Initialize these with empty middleware stacks
  // so that our mu-crud can just assume they exist
  actions.validating = compose();
  actions.saving = compose();
  actions.updating = compose();
  actions.creating = compose();

  return actions;
};