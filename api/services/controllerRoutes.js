var _ = require('underscore');

function parseRoute(route, controllerName) {
  return route.replace(/\@/g, '/' + controllerName);
}

module.exports = function(sails) {
  _.each(sails.controllers, function(controller, controllerName) {
    if(controller._routes) {
      _.each(controller._routes, function(action, path) {
        sails.router.staticRoutes[parseRoute(path, controllerName)] = {
          controller: controllerName,
          action: action
        };
      });
    }
  });

  sails.router.flush();
};