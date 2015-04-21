/**
 * Libs
 */

var errors = require('lib/errors');
var Group = require('lib/Group/model');

exports.setGroupType = function(req, res, next) {
  req.body.groupType = 'board';
  console.log('body', req.body);
  next();
};

exports.lookUp = function(req, res, next) {
  var id = req.param('id');
  Group.where({id: id, groupType: 'board'})
    .exec(function(err, model) {
      if(err) return next(err);
      if(! model && options['404']) {
        return next(errors.NotFound('Board not found',
          'id', id));
      }

      req.group = model;

      next();
    });
};