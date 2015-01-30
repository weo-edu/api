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

      keyOption: function(key, option) {
        var path = self.schema.path(property + '.total');
        return path.schema.tree[key][option];
      },

      keyValue: function(property, as, share) {
        if (this.keyOption(as, 'root'))
          return share.get(property) || this.keyOption(as, 'default');
        else
          return share.object.get(property) || this.keyOption(as, 'default');
      },

      get: function(key, actorId) {
        var selfLink = this;
        return self[property].total.reduce(function(memo, total) {
          if(contexts.indexOf(total.context) === -1)
            return memo;

          var val = actorId
            ? total.actors[actorId] ? total.actors[actorId][key] : selfLink.keyOption(key, 'default')
            : total[key];

          // add seperator for strings
          if (memo && _.isString(val))
            memo += ':';

          if (val !== undefined)
            return memo + val;
          else
            return memo;
        }, selfLink.keyOption(key, 'default'));
      },

      actors: function(value) {
        return _.flatten(contexts.map(function(context) {
          var total = _.find(self[property].total, function(total) {
            return total.context.toString() === context;
          });
          if (!total)
            return [];
          if (value)
            return _.values(total.actors);
          else
            return _.keys(total.actors);
        }));
      },

      _update: function(key, val, actor) {
        var selfLink = this;
        contexts.forEach(function(context) {
          var total = _.find(self[property].total, function(total) {
            return total.context.toString() === context;
          });

          var wasNew = ! total;
          if(wasNew) {
            total = {context: context, actors: {}};
          }

          total[key] = total[key] || selfLink.keyOption(key, 'default');
          if (!selfLink.keyOption(key, 'replace'))
            total[key] += val;
          else
            total[key] = val;

          if (!total.actors[actor.id]) {
            total.actors[actor.id] = {actor: _.clone(actor)};
          }
          total.actors[actor.id][key] = total.actors[actor.id][key] || selfLink.keyOption(key, 'default');
          if (!selfLink.keyOption(key, 'replace'))
            total.actors[actor.id][key] += val;
          else
            total.actors[actor.id][key] = val;

          if (total.markModified)
            total.markModified('actors.' + actor.id + '.' + key);

          // XXX Pushing totals at the end appears to be necessary
          // to get mongoose to properly identify these properties
          // as changed in certain circumstances.  Not sure
          //  exactly why.
          if(wasNew)
            self[property].total.push(total);
        });

        self[property].canonicalTotal[key] = self[property].canonicalTotal[key] || selfLink.keyOption(key, 'default');
        if (!selfLink.keyOption(key, 'replace'))
          self[property].canonicalTotal[key] += val;
        else
          self[property].canonicalTotal[key] = val;

        return this;
      },

      last: function(share) {
        var actor = share.actor;
        self[property].last.actor.image.url = actor.image.url;
        self[property].last.actor.displayName = actor.displayName;
        self[property].last.actor.id = actor.id;
        self[property].last.actor.url = actor.url;
        self[property].last.id = share.id;
        self[property].last.updatedAt = share.createdAt;
      },

      push: function(share) {
        var selfLink = this;
        this._update('items', 1, share.actor);
        this.totals().forEach(function(total) {
          selfLink._update(total.as, selfLink.keyValue(total.property, total.as, share), share.actor);
        });
        this.last(share);
      },

      remove: function(share) {
        var selfLink = this;
        this._update('items', -1, share.actor);
        this.totals().forEach(function(total) {
          // removes only work for numbers
          if (selfLink.keyOption(total.as, 'type') === Number)
            selfLink._update(total.as, -selfLink.keyValue(total.property, total.as, share), share.actor);
        });
      },

      update: function(share) {
        var selfLink = this;
        this.totals().forEach(function(total) {
          // updates only work for replaces
          if (selfLink.keyOption(total.as, 'replace')) {
            selfLink._update(total.as, selfLink.keyValue(total.property, total.as, share), share.actor);
          }
        });
      }
    };
  });
};

selfLink.totalSchema = new Schema({
  context: {
    type: String,
    validate: [
      function(str) {
        return str === 'public' || validateObjectId(str);
      }
    ]
  },
  items: {
    type: Number,
    default: 0
  },
  actors: {},
}, {id: false, _id: false});

selfLink.schema = new Schema({
  total: [selfLink.totalSchema.embed()],
  canonicalTotal: {
    items: {
      type: Number,
      default: 0
    }
  },
  last: {
    actor: {
      displayName: String,
      id: String,
      image: {
        url: String
      },
      url: String
    },
    updatedAt: Date,
    id: {type: String}
  }
}, {id: false, _id: false});

selfLink.embed = function(urlGetter, aggregations) {
  if('function' !== typeof urlGetter)
    throw new Error('Must specify urlGetter when embedding selfLink');

  var extend = {};
  aggregations && aggregations.forEach(function(property) {
    if (_.isString(property)) {
      extend[property] = {
        type: Number,
        default: 0,
        property: property
      };
    } else {
      var options = property;
      var as = options.as || options.property;
      extend[as] = _.defaults({
        type: options.type,
        replace: options.replace,
        root: options.root,
        property: options.property
      }, {
        type: Number,
        replace: false,
        root: false
      });
      extend[as].default = extend[as].type === Number ? 0 : '';
    }
  });
  var schema = selfLink.schema.extend({
    total: [selfLink.totalSchema.extend(extend).embed()]
  }).embed();

  schema.selfLink = {
    type: String
  };

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

