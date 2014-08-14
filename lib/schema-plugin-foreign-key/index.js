var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var validations = require('lib/validations');
var _ = require('lodash');

module.exports = function(schema, opts) {
  schema.plugin(require('lib/schema-plugin-events'));

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
    },
    content: {
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

  schema.when('pre:change', function(model, next) {
    model.$changedKey = ! _.isEqual(model.toKey(), model.$previousKey);
    next();
  });

  schema.post('init', function() {
    this.$previousKey = this.toKey();
  });

  schema.when('post:change', function(model) {
    if(model.$changedKey) {
      model.updateAllForeignKeys();
    }
  });

  var refs = [];
  schema.static('ref', function(Collection, path) {
    refs.push({collection: Collection, path: path});
    return this;
  });

  schema.method('updateAllForeignKeys', function() {
    var self = this;
    refs.forEach(function(ref) {
      self.updateForeignKey(ref.collection, ref.path);
    });
  });

  function getUpdatePathPrefix(Collection, path) {
    return path.split('.').reduce(function(memo, part) {
      memo += part;
      return memo + (Array.isArray(Collection.schema.path(memo).options.type)
        ? '.$.'
        : '.');
    }, '');
  }

  schema.method('updateForeignKey', function(Collection, path, cb) {
    if('string' === typeof Collection)
      Collection = mongoose.model(Collection);

    var field = Collection.schema.path(path);
    // Due to the possibility of discriminated schemas, this particular
    // instance of a given model may not actually have a defined type
    // at this path.  In that case, we don't want to do anything.
    if(field) {
      var updatePath = getUpdatePathPrefix(Collection, path);
      var selector = {};
      var update = {};
      var desc = this.toKey();

      selector[path + '.id'] = desc.id;

      for(var k in desc)
        update[updatePath + k] = desc[k];

      Collection.update(selector, update, {multi: true}, cb || function(err) {
        if(err) throw err;
      });
    }
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