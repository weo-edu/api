var MongoClient = require('mongodb').MongoClient;

/*
  Drop indexes so that the tags index gets rebuilt
 */
exports.up = function(next){
  MongoClient.connect(require('../lib/config').mongo.url, function(err, db) {
    var Shares = db.collection('shares');
    Shares.dropAllIndexes(next);
  });
  next();
};

exports.down = function(next){
  next();
};
