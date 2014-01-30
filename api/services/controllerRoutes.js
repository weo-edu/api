var _ = require('underscore');

function parseRoute(route, controllerName) {
  return route.replace(/\@/g, '/' + controllerName);
}

module.exports = function(sails) {
  _.each(sails.controllers, function(controller, controllerName) {
    if(controller._routes) {
      _.each(controller._routes, function(action, path) {
        if (_.isString(action)) {
          route = {
            controller: controllerName,
            action: action
          };
        } else {
          route = action;
        }
        sails.router.staticRoutes[parseRoute(path, controllerName)] = route;
      });
    }
  });

  sails.router.flush();
};