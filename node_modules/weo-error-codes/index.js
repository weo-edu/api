var _ = require('lodash');
var _s = require('underscore.string')

var defaultCodes = ["missing", "missing_field", "invalid", "already_exists"];

module.exports = function(codes) {
  codes = defaultCodes.concat(codes);
  return function(req, res, next) {
    function ClientError(message) {
      this.message = message;
      this.errors = [];
    }

    ClientError.prototype.send = function(status) {
      res.json(status, this);
    };

    ClientError.prototype.fromSails = function(resource, sailsError) {
      var self = this;
      _.each([].concat(sailsError), fromSails);
      return this;

      function fromSails(sailsError) {
        if(sailsError.ValidationError) {
          this.message = 'ValidationError';
          _.each(sailsError.ValidationError, function(errors, field) {
            _.each(errors, function(err) {
              var code;
              switch(err.rule) {
              case 'unique':
                code = 'already_exists';
                break;
              case 'required':
                code = 'missing_field';
                break;
              default:
                code = 'invalid';
                break;
              }
              delete err.message;
              self[_s.camelize(code)](resource, field, err);
            });
          });
        }
      }
    };

    _.each(codes, function(code) {
      ClientError.prototype[_s.camelize(code)] = function(resource, field, details) {
        this.errors.push({
          resource: resource,
          field: field,
          code: code, 
          details: details
        });
        return this;
      };
    });

    res.clientError = function(message) {
      return (new ClientError(message));
    };
    next();
  };
};