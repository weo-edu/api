var _ = require('lodash')
  , anchor = require('anchor');

function anchorify(attrs) {
  var validations = {};
  for(var attr in attrs) {
    var validation = validations[attr] = {};
    var attrsVal = attrs[attr];

    if(typeof attrsVal === 'string')
      attrsVal = {type: attrsVal};

    for(var prop in attrsVal) {
      if(/^(defaultsTo|primaryKey|autoIncrement|unique|index|columnName)$/.test(prop)) continue;

      // use the Anchor `in` method for enums
      if(prop === 'enum') {
        validation['in'] = attrsVal[prop];
      }
      else {
        validation[prop] = attrsVal[prop];
      }
    }
  }
  return validations;
}

module.exports = function(attrs, types) {
  var validations = anchorify(attrs);
  anchor.define(types || {});

  var validators = {};
  _.each(validations, function(curValidation, name) {
    validators[name] = function(value, model, cb) {
      var requirements = anchor(curValidation);
      // Grab value and set to null if undefined
      if(typeof value == 'undefined') value = null;



      var res = {};
      _.each(requirements.data, function(req, key) {
        // type requirement rules are named
        // for the value of the type field
        res[key === 'type' ? req : key] = true;
        if(typeof req !== 'function') return;
        requirements.data[key] = req.apply(model, []);
      });

      function runCb() {
         cb && _.each(res, function(val, key) {
          cb(key, val);
        });
      }

      // If value is not required and empty then don't
      // try and validate it
      if(!curValidation.required) {
        if(value === null || value === '') {
          runCb();
          return true;
        }

      }


      // If Boolean and required manually check
      if(curValidation.required && curValidation.type === 'boolean') {
        if(value.toString() == 'true' || value.toString() == 'false') {
          runCb();
          return true;
        }
      }

      var err = anchor(value).to(requirements.data, model);
      _.each(err, function(val, key) {
        res[val.rule] = false;
      });

      runCb();

      return ! (err && err.length);
    };
    // keep track of required validators
    validators[name].required = curValidation.required;
  });

  validators.$validate = function(model, cb) {
    var self = this
    var validity = _.map(validators, function(fn, prop) {
      return prop !== '$validate'
        ? self[prop](model[prop], model, cb && cb.bind(null, prop))
        : true;
    });

    return _.all(validity, _.identity);
  };

  return validators;
};