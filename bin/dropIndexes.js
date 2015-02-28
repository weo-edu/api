var mongo = require('mongodb').MongoClient;
var url = process.env.MONGO_URL;
var async = require('async');

mongo.connect(url, function(err, db) {
  if(err) throw err;

  db.collectionNames(function(err, collections) {
    if(err) throw err;
    console.log('dropping indexes for', collections);
    async.each(collections, function(colInfo, cb) {
      var name = colInfo.name.split('.')[1];
      if(name === 'system')
        return cb(null);

      db.collection(name, function(err, col) {
        if(err) return cb(err);
        col.dropAllIndexes(cb);
      });
    }, function(err) {
      if(err)
        console.log('err', err);
      else
        console.log('dropped all indexes');

      db.close();
    });
  });
});

