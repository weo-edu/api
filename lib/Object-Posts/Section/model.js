var SectionSchema = require('./schema');
var _ = require('lodash');

SectionSchema.method('grade', function() {
  console.log('grad section');
  var numPoints = 0;
  var points = _.reduce(this.attachments, function(memo, object) {
    if (object.points) {
      memo.max += object.points.max;
      memo.scaled += object.points.scaled;
      numPoints ++;
    }
    return memo;
  }, {max: 0, scaled: 0});
  console.log('points', this.points);
  if (numPoints)
    points.scaled /= numPoints;

  console.log('schema', this.points.schema.tree);
  _.extend(this.points, points);
  this.share().markChanged('_object[0].points.scaled'); //XXX hacky
});


module.exports = {schema: SectionSchema};