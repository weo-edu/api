var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var validateObjectId = require('lib/validations').ObjectId();
var _ = require('lodash');
var async = require('async');
var utils = require('lib/utils');

var selfLink = module.exports = function(Schema) {
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

  Schema.method('populateSelfLink', function(key, cb) {
    var Channel = mongoose.model('Channel');
    var self = this;
    Channel.findOne({channel: self[key].selfLink}, function(err, channel) {
      if (err) return cb(err);
      if (!channel) {
        channel = new Channel({channel: self[key].selfLink});
        channel.object = self[key].toJSON();
      }
      var set = {};
      set[key] = channel.object.toJSON ? channel.object.toJSON() : channel.object;
      self.set(set);
      cb(null, channel);
    });
  });

  Schema.method('populateSelfLinks', function populateSelfLinks(cb, obj) {
    if (!obj)
      obj = this;

    var tasks = [];
    _.each(obj.toJSON ? obj.toJSON() : obj, function(value, key) {
      if (_.isObject(value) || _.isArray(value)) {
        if (_.has(value, 'selfLink')) {
          tasks.push(function(cb) {
            obj.populateSelfLink(key, cb);
          });
        } else {
          tasks.push(function(cb) {
            populateSelfLinks(cb, obj[key]);
          });
        }
      }
    });

    if (!tasks.length)
      return cb(null, obj);

    async.parallel(tasks, function(err) {
      if (err) return cb(err);
      cb(null, obj);
    });
  });


  Schema.method('selfLink', function(property) {
    var contexts = [];
    var self = this;

    return {
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
          });
        }
      },

      keyOption: function(key, option) {
        var path = self.schema.path(property + '.total');
        return path.schema.tree[key][option];
      },

      keyValue: function(key, share) {
        if (this.keyOption(key, 'root'))
          return share[key];
        else
          return share.object[key];
      },

      get: function(key, actorId) {
        return self[property].total.reduce(function(memo, total) {
          if(contexts.indexOf(total.context) === -1)
            return memo;

          var val = actorId
            ? total.actors[actorId] ? total.actors[actorId][key] : 0
            : total[key];

          return memo + val;
        }, 0);
      },

      actors: function() {
        if (contexts.length !== 1) {
          throw Error('can only get actors for 1 context');
        }
        var total = _.find(self[property].total, function(total) {
          return total.context.toString() === contexts[0];
        });
        return _.keys(total.actors);
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
        this.totals().forEach(function(key) {
          selfLink._update(key, selfLink.keyValue(key, share), share.actor);
        });
        this.last(share);
      },

      remove: function(share) {
        this._update('items', -1, share.actor);
        this.totals().forEach(function(key) {
          // removes only work for numbers
          if (selfLink.keyOption(key, 'type') === Number)
            selfLink._update(key, -selfLink.keyValue(key, share), share.actor);
        });
      },

      update: function(share) {
        var selfLink = this;
        this.totals().forEach(function(key) {
          // updates only work for replaces
          if (selfLink.keyOption(key, 'replace')) {
            selfLink._update(key, selfLink.keyValue(key, share), share.actor);
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
        default: 0
      };
    } else {
      var options = property;
      extend[options.property] = {
        type: options.type,
        replace: options.replace,
        default: options.type === Number ? 0 : '',
        root: options.root
      };
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

selfLink.middleware = function(Model, opts) {
  opts = opts || {};
  if(opts['404'] === undefined)
    opts['404'] = true;

  var name;
  if (_.isString(Model))
    name = Model;
  else
    name = utils.uncapitalize(Model.modelName);

  return function(req, res, next) {
    var model = req[name];
    //XXX cleanup
    if (! model) {
      if(opts['404']) {
        next(new Error('client error'));
        console.error('self link middleware error', req.body);
      } else
        next();

      return;
    }

    model.populateSelfLinks(function(err) {
      next(err);
    });
  };
};
