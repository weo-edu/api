/**
 * SearchController
 *
 * @module      :: Controller
 * @description	:: A set of functions called `actions`.
 *
 *                 Actions contain code telling Sails how to respond to a certain type of request.
 *                 (i.e. do stuff, then send some JSON, show an HTML page, or redirect to another URL)
 *
 *                 You can configure the blueprint URLs which trigger these actions (`config/controllers.js`)
 *                 and/or override them with custom routes (`config/routes.js`)
 *
 *                 NOTE: The code you write here supports both HTTP and Socket.io automatically.
 *
 * @docs        :: http://sailsjs.org/#!documentation/controllers
 */
var _ = require('underscore')
  , sails = require('sails');

function search(name) {
  sails.on('bootstrap', function() {
    sails.adapters['sails-mongo'].native(name, function(err, collection) {
      if(err) throw err;
      collection.ensureIndex({'$**': 'text'}, {name: "TextIndex"}, function(err) {
        if(err) throw err;
      });
    });
  });

  return function(req, res, next) {
    var q = req.param('q')
      , sailsMongo = sails.adapters['sails-mongo'];

    sailsMongo['native'](name, function(err, collection) {
      if(err) return res.serverError(err);

      return collection.db.command({text: name, search: q || ''},
        function(err, result) {
        if(err) res.serverError(err);
        else {
          res.json(_.map(result.results, function(res) {
            return res.obj;
          }));
        }
      });
    });
  }
}

module.exports = {
  /**
   * Overrides for the settings in `config/controllers.js`
   * (specific to SearchController)
   */
  _config: {},
  _routes: {
    'GET @/skills/:q?': 'skills',
    'GET @/tags/:q?': 'tags'
  },
  skills: search('skill'),
  tags: search('tag')

};
