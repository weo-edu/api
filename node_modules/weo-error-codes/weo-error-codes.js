var _ = require('lodash')
  , _s = require('underscore.string');
module.exports = require('./package.json').name;
angular.module(module.exports, [])
.factory('WeoError', ['$q', function($q) {
  function WeoError(form) {
    var self = this;
    this.data = {};
    this.form = form;
    function addField(field) {
      field && field.$parsers && field.$parsers.unshift(function(val) {
        _.each(self.data, function(data, action) {
          self.success(action)();
        });
        return val;
      });
    }
    _.each(this.form, addField);
    // add validators for future fields on form
    var addControl = form.$addControl;
    form.$addControl = function(control) {
      addControl.call(form, control);
      addField(control);
    };
  }

  WeoError.prototype.success = function(key) {
    var self = this;
    return function(val) {
      _.each(self.data[key], function(error) {
        self.form[error.field].$setValidity(error.code, true);
      });
      delete self.data[key];
      return val;
    };
  };

  WeoError.prototype.failure = function(key) {
    var self = this;
    return function(err) {
      self.data[key] = err.data.errors;
      err && _.each(err.data.errors, function(error) {
        self.form[error.field].$setValidity(error.code, false);
      });
      return $q.reject(err);
    };
  }

  return WeoError;
}]);