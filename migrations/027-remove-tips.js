var db = require('monk')(require('../lib/config/').mongo)
var shares = db.get('shares')

exports.up = function(next){
  shares.remove({'_object.0.objectType': 'tip'}, next)
};

exports.down = function(next){
  next();
};
