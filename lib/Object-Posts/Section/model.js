var SectionSchema = require('./schema');

SectionSchema.method('grade', function() {
  var numPoints = 0;
  this.points = _.reduce(this.attachments, function(memo, object) {
    if (object.points) {
      memo.max += object.points.max;
      memo.scaled += object.points.scaled;
      numPoints ++;
    }
    return memo;
  }, {max: 0, scaled: 0});
  if (numPoints)
    this.points.scaled /= numPoints;
  console.log('points', this.points);
});


module.exports = {schema: SectionSchema};