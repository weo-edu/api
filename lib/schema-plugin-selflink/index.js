var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var validateObjectId = require('lib/validations').ObjectId();
var _ = require('lodash');

var selfLink = module.exports = function(Schema) {
  // Create selfLink urls if they do not yet exist
  Schema.pre('save', function(next) {
    var self = this;

    Object.keys(self.schema.paths).forEach(function(path) {
      var pathSchema = self.schema.path(path);
      if(path.indexOf('.selfLink') !== -1
        && pathSchema.options.selfLinkFn) {
        var fn = pathSchema.options.selfLinkFn;
        if (! self.get(path)) {
          self.set(path, fn.call(self));
        }
      }
    });
    next();
  });


  Schema.method('selfLink', function(property) {
    var contexts = [];
    var self = this;

    function keyOptions(key) {
      var path = self.schema.path(property + '.total');
      return path.schema.tree[key];
    }

    function keyValue(property, as, share) {
      var opts = keyOptions(as);
      var prop = opts.root
        ? share.get(property)
        : share.object.get(property);

      return prop || opts.default;
    }

    function getContextualTotal(context) {
      return _.find(self[property].total, function(total) {
        return total.context.toString() === context;
      });
    }

    function update(key, val, actor) {
      var keyOpts = keyOptions(key);

      function aggregate(obj) {
        obj[key] = obj[key] || keyOpts.default;
        obj[key] = keyOpts.replace
          ? val
          : obj[key] + val;
      }

      contexts.forEach(function(context) {
        var total = getContextualTotal(context);
        var wasNew = ! total;

        if(wasNew)
          total = {context: context, actors: {}};

        aggregate(total);

        if (! total.actors[actor.id])
          total.actors[actor.id] = {actor: _.clone(actor)};

        aggregate(total.actors[actor.id]);

        if (total.markModified)
          total.markModified('actors.' + actor.id + '.' + key);

        // XXX Pushing totals at the end appears to be necessary
        // to get mongoose to properly identify these properties
        // as changed in certain circumstances.  Not sure
        //  exactly why.
        if(wasNew)
          self[property].total.push(total);
      });

      aggregate(self[property].canonicalTotal);
      return self;
    }

    return {
      self: self,
      context: function(context) {
        // context may be an array
        contexts = contexts.concat(context);
        return this;
      },
      totals: function() {
        var excluded = ['context', 'items', 'id', '_id', 'actors'];
        var path = self.schema.path(property + '.total');
        if(path) {
          return Object.keys(path.schema.tree).filter(function(key) {
            return excluded.indexOf(key) === -1;
          }).map(function(key) {
            return {
              as: key,
              property: path.schema.tree[key].property || key
            };
          });
        } else
          return [];
      },
      get: function(key, actorId) {
        var keyOpts = keyOptions(key);
        return self[property].total.reduce(function(memo, total) {
          if(contexts.indexOf(total.context) === -1)
            return memo;

          var val = actorId
            ? total.actors[actorId] ? total.actors[actorId][key] : keyOpts.default
            : total[key];

          // Add separator for strings
          if (memo && _.isString(val))
            memo += ':';

          return val === undefined
            ? memo
            : memo + val;
        }, keyOpts.default);
      },
      hasActor: function(actorId) {
        return contexts.some(function(context) {
          return _.has(self[property].total.actors, actorId);
        });
      },
      actors: function(getValues) {
        return contexts.reduce(function(memo, context) {
          var total = getContextualTotal(context);

          if(total) {
            var vals = getValues ? _.values(total.actors) : _.keys(total.actors);
            memo.push.apply(memo, vals);
          }

          return memo;
        }, []);
      },
      push: function(share) {
        update('items', 1, share.actor);
        this.totals().forEach(function(total) {
          var value = keyValue(total.property, total.as, share);
          update(total.as, value, share.actor);
        });
      },
      remove: function(share) {
        update('items', -1, share.actor);
        this.totals().forEach(function(total) {
          // Removes only work for numbers
          if(keyOptions(total.as).type === Number) {
            var value = keyValue(total.property, total.as, share);
            update(total.as, -value, share.actor);
          }
        });
      },
      update: function(share) {
        this.totals().forEach(function(total) {
          // Updates only work for replaces
          if(keyOptions(total.as).replace) {
            var value = keyValue(total.property, total.as, share);
            update(total.as, value, share.actor);
          }
        });
      }
    };
  });
};

selfLink.totalSchema = new Schema({
  context: {
    type: String,
    trusted: true,
    validate: [
      function(str) {
        return str === 'public' || validateObjectId(str);
      }
    ]
  },
  items: {
    type: Number,
    trusted: true,
    default: 0
  },
  actors: {
    type: {},
    trusted: true
  },
}, {id: false, _id: false});

selfLink.schema = new Schema({
  total: [selfLink.totalSchema.embed()],
  canonicalTotal: {
    items: {
      trusted: true,
      type: Number,
      default: 0
    }
  }
}, {id: false, _id: false});

selfLink.embed = function(urlGetter, aggregations) {
  if('function' !== typeof urlGetter)
    throw new Error('Must specify urlGetter when embedding selfLink');

  var extend = {};
  aggregations && aggregations.forEach(function(property) {
    var options = property;
    if('string' === typeof options) {
      options = {
        property: property,
        type: Number
      };
    }

    var as = options.as || options.property;
    extend[as] = _.defaults(options, {
      type: Number,
      replace: false,
      root: false
    });

    extend[as].trusted = true,
    extend[as].default = extend[as].type === Number ? 0 : '';
  });

  var schema = selfLink.schema.extend({
    total: [selfLink.totalSchema.extend(extend).embed()],
    selfLink: {
      type: String,
      trusted: true
    }
  }).embed();

  _.extend(schema.canonicalTotal, extend);

  // XXX Awful hack so that this doesn't get set
  // on the client
  if('undefined' === typeof window)
    schema.selfLink.selfLinkFn = urlGetter;

  //XXX hack to get rid of id and _id on totals
  schema.total[0] = new Schema(schema.total[0], {id: false, _id: false});
  return schema;
};


selfLink.strip = function strip(update) {
  _.each(update, function(value, key) {
    if (_.isObject(value)) {
      if (_.has(value, 'selfLink'))
        delete update[key];
      else
        strip(value);
    } else if (_.isArray(value)) {
      stip(value);
    }
  });
  return update;
};