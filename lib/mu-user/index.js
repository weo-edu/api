let mu = require('mu-js');
let _ = require('mu-route');
let app = module.exports = mu.service();
let actions = require('./actions');

app.use(_.post('/'
  , actions.mutating({isNew: true})
  , actions.validating
  , actions.validate
  , actions.creating
  , actions.saving
  , actions.create
  , actions.created
  , actions.saved));

app.use(_.put('/'
  , actions.mutating()
  , actions.validating
  , actions.validate
  , actions.updating
  , actions.saving
  , actions.update
  , actions.updated
  , actions.saved));

app.use(_.get('/username/:username'
  , actions.byUsername));

app.use(_.get('/:id'
  , actions.byId));

app.use(_.put('/:id'
  , actions.update));