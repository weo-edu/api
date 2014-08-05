var Schema = require('mongoose').Schema;
var validations = require('lib/validations');

module.exports = function(schema, opts) {
  schema.foreignKey = new Schema({
    id: {
      type: String,
      required: true,
      validate: [
        validations.ObjectId,
        'Invalid ObjectId'
      ],
    },
    image: {
      url: {
        type: String
      }
    },
    url: {
      type: String,
      required: true
    },
    displayName: {
      type: String
    }
  }, {_id: false, id: false});

  function defaultTransform() {
    return {
      id: this.id,
      url: '/' + opts.model[0].toLowerCase() + opts.model.slice(1) + '/' + this.id,
      displayName: this.displayName
    };
  }

  var pipeline = [defaultTransform].concat(opts.transform || function(o) { return o; });

  schema.static('toKey', function(group) {
    return pipeline.reduce(function(memo, fn) {
      return fn.call(group, memo);
    }, {});
  });

  // Alias static method
  schema.method('toKey', function() {
    return this.constructor.toKey(this);
  });
};

module.exports.abstractKey = new Schema({
  id: {
    type: String,
    required: true,
    validate: [
      validations.ObjectId(),
      'Invalid ObjectId'
    ]
  },
  image: {
    url: {
      type: String
    }
  },
  url: {
    type: String,
    required: true
  },
  displayName: {
    type: String,
    required: true
  }
}, {_id: false, id: false});