var VoteSchema = require('./schema');

VoteSchema.method('verb', function() {
  return 'voted on';
});

VoteSchema.method('fill', function(parent) {
  var votes = parent.object.selfLink('votes');
  var points = votes
    .context(this.share().contextIds)
    .get('points', this.share().actor.id) || 0;
    
  var self = this;
  
  var dwitch = {
    up: function() {
      if (points > 0) {
        self.displayName = 'undo up vote';
        self.action = 'undoup';
        self.points = -1;
      } else if (points < 0) {
        self.displayName = 'switch to up vote';
        self.action = 'switchup';
        self.points = 2;
      } else {
        self.displayName = 'up vote';
        self.action = 'up';
        self.points = 1;
      }
    },
    down: function() {
      if (points > 0) {
        self.displayName = 'switch to down vote';
        self.action = 'switchdown';
        self.points = -2;
      } else if (points < 0) {
        self.displayName = 'undo down vote';
        self.action = 'undodown';
        self.points = 1;
      } else {
        self.displayName = 'down vote';
        self.action = 'down';
        self.points = -1;
      }
    }
  };
  dwitch[this.action]();
  
});

module.exports = {schema: VoteSchema};

