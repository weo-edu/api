var Schema = require('mongoose').Schema;
var validateObjectId = require('lib/validations').ObjectId();
var _ = require('lodash');

var selfLink = module.exports = function(Schema) {
  Object.keys(Schema.paths).forEach(function(path) {
    var pathSchema = Schema.path(path);
    if(path.indexOf('.selfLink') !== -1
      && pathSchema.options.selfLinkFn) {
      var fn = pathSchema.options.selfLinkFn;
      Schema.pre('save', function(next) {
        if(! this.get(path))
          this.set(path, fn.call(this));
        next();
      });
    }
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
          throw Error('can only get actors for 1 context')
        }
        var total = _.find(self[property].total, function(total) {
          return total.context.toString() === contexts[0];
        });
        return _.keys(total.actors);
      },

      increment: function(key, val, actor) {
        contexts.forEach(function(context) {
          var total = _.find(self[property].total, function(total) {
            return total.context.toString() === context;
          });

          var wasNew = ! total;
          if(wasNew) {
            total = {context: context, actors: {}};
          }

          total[key] = total[key] || 0;
          total[key] += val;

          if (!total.actors[actor.id]) {
            total.actors[actor.id] = {actor: _.clone(actor)};
          }
          total.actors[actor.id][key] = total.actors[actor.id][key] || 0;
          total.actors[actor.id][key] += val;
          if (total.markModified)
            total.markModified('actors.' + actor.id + '.' + key);

          // XXX Pushing totals at the end appears to be necessary
          // to get mongoose to properly identify these properties
          // as changed in certain circumstances.  Not sure
          //  exactly why.
          if(wasNew)
            self[property].total.push(total);
        });

        self[property].canonicalTotal[key] = self[property].canonicalTotal[key] || 0;
        self[property].canonicalTotal[key] += val;
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
        this.increment('items', 1, share.actor);
        this.totals().forEach(function(key) {
          selfLink.increment(key, share.object[key], share.actor);
        });
        this.last(share);
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
    extend[property] = {
      type: Number,
      default: 0
    };

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