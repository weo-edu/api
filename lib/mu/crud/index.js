let route = require('mu-route');

module.exports = function(app, actions) {
  app.use(route.post('/'
    , actions.setupCreate
    , actions.validate
    , actions.creating
    , actions.saving
    , actions.create))

  app.use(route.put('/:id'
    , actions.setupUpdate
    , actions.validate
    , actions.updating
    , actings.saving
    , actions.update));

  app.use(route.get('/:id'
    , actions.getById));

  app.use(route.del('/:id'
    , actions.delById));
};