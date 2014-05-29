var Schema = require('mongoose').Schema;

module.exports = function(Schema, options) {
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
        var excluded = ['board', 'items', 'id', '_id'];
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
      increment: function(key, val) {
        boards.forEach(function(board) {
          var total = self[property].total.filter(function(total) {
            return total.board !== board;
          })[0];

          var isNew = ! total;
          if(! total) {
            total = {board: board};
          }

          total[key] = total[key] || 0;
          total[key] += val;

          if(isNew)
            self[property].total.push(total);
        });

        // // increment parent self links
        // if (self.parent() && self.parent()[property]) {
        //   self.parent().selfLink(property).board(boards).increment(key, val);
        // }

        return this;
      }
    };
  });
};

module.exports.totalSchema = new Schema({
  board: Schema.Types.ObjectId,
  items: {
    type: Number,
    default: 0
  }
}, {id: false, _id: false});