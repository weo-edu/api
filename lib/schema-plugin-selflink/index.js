var Schema = require('mongoose').Schema;

var selfLink = module.exports = function(Schema, options) {
  Schema.method('selfLink', function(property) {
    var boards = [];
    var selfLink = this[property];
    var self = this;

    return {
      board: function(board) {
        // board may be an array
        boards = boards.concat(board);
        return this;
      },
      totals: function() {

        var excluded = ['board', 'items', 'id', '_id', 'actors'];
        var path = self.schema.path(property + '.total');
        if(path) {
          return Object.keys(path.schema.tree).filter(function(key) {
            return excluded.indexOf(key) === -1;
          });
        }
      },
      get: function(key) {
        return self[property].total.reduce(function(memo, total) {
          if(boards.indexOf(total.board) === -1)
            return memo;
          return memo + total[key];
        }, 0);
      },
      increment: function(key, val, actor) {
        boards.forEach(function(board) {
          var total = self[property].total.filter(function(total) {
            return total.board !== board;
          })[0];

          var isNew = ! total;
          if(! total) {
            total = {board: board, actors: {}};
          }

          total[key] = total[key] || 0;
          total[key] += val;

          if (!total.actors[actor.id]) {
            total.actors[actor.id] = {actor: _.clone(actor)};
          }
          total.actors[actor.id][key] = total.actors[actor.id][key] || 0;
          total.actors[actor.id][key] += val;

          if(isNew)
            self[property].total.push(total);

        });

        // // increment parent self links
        // if (self.parent() && self.parent()[property]) {
        //   self.parent().selfLink(property).board(boards).increment(key, val);
        // }

        return this;
      },

      last: function(share) {
        self[property].last.actor = _.clone(share.actor);
        self[property].last.id = share.id;
        self[property].last.updatedAt = share.createdAt;
      },

      push: function(share) {
        var selfLink = this;
        console.log('actor', share.actor);
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
  board: Schema.Types.ObjectId,
  items: {
    type: Number,
    default: 0
  },
  actors: Schema.Types.Mixed
}, {id: false, _id: false});

selfLink.schema = new Schema({
  selfLink: {
    type: String,
    requred: true
  },
  total: [selfLink.totalSchema.embed()],
  last: {
    actor: {
      displayName: String,
      id: String,
      image: {
        url: String
      }
    },
    updatedAt: Date,
    id: String
  }
}, {id: false, _id: false});

selfLink.embed = function() {
  var extend = {};
  var aggregations = [].slice.call(arguments);
  aggregations.forEach(function(property) {
    extend[property] = {
      type: Number,
      default: 0
    };
  });
  var schema = selfLink.schema.extend({
    total: [selfLink.totalSchema.extend(extend).embed()]
  }).embed();
  //XXX hack to get rid of id and _id on totals
  schema.total[0] = new Schema(schema.total[0], {id: false, _id: false});
  return schema;
}