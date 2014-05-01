var mongoose = require('mongoose');
var errors = require('lib/errors');

function capitalize(str) {
  return str[0].toUpperCase() + str.slice(1);
}

function uncapitalize(str) {
  return str[0].toLowerCase() + str.slice(1);
}

/**
 * Decorate the request object with a model, parameterized
    by the request params
 * @param  {Mongoose Model} Model - The model class
 * @param  {Object|String} options - if string, treated as the 'prop' option
 * @param {String}  [varname] [description]
 *         Properties:
 *
 *         - {String} param - name of the parameter in the query
 *                            and name of the field in the model
 *         - {String} prop - name of the property to set the result
 *                           to on the request object
 *         - {Boolean} multi - is this a query for multiple objects
 */
module.exports = function(Model, options) {
  options = options || {};
  if('string' === typeof options)
    options = {param: options};

  if(options['404'] === undefined)
    options['404'] = true;

  var multi = options.multi || false;
  var param = options.param || 'id';
  var key = options.key || param;
  if(key === 'id')
    key = '_id';

  return function(req, res, next) {
    Model = 'string' === typeof Model
      ? mongoose.model(Model)
      : Model;

    var prop = options.prop || uncapitalize(Model.modelName);
    var query = multi ? Model.find() : Model.findOne();
    query.where(key, req.param(param))
      .exec(function(err, model) {
        if(err) return next(err);
        if(! model && options['404']) {
          return next(errors.NotFound(Model.modelName + ' user not found',
            key, req.param(param)));
        }

        req[prop] = model;
        next();
      });
  };
};