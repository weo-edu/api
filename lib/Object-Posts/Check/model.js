var CheckSchema = require('./schema');

CheckSchema.method('verb', function() {
  return 'validated';
});

CheckSchema.method('fill', function(parent) {
  var checks = parent.object.selfLink('votes');
  var points = checks
    .context(this.share().contextIds)
    .get('points', this.share().actor.id) || 0;

  var self = this;
  {
    check: function() {
      if (points > 0) {
        self.displayName = 'undo check';
        self.action = 'undocheck';
        self.points = -1;
      } else if (points < 0) {
        self.displayName = 'switch to check';
        self.action = 'switchcheck';
        self.points = 2;
      } else {
        self.displayName = 'check';
        self.action = 'check';
        self.points = 1;
      }
    },
    ex: function() {
      if (points > 0) {
        self.displayName = 'switch to ex';
        self.action = 'switchex';
        self.points = -2;
      } else if (points < 0) {
        self.displayName = 'undo ex';
        self.action = 'undoex';
        self.points = 1;
      } else {
        self.displayName = 'ex';
        self.action = 'ex';
        self.points = -1;
      }
    }
  }[this.action]();
  
});

module.exports = {schema: CheckSchema};

