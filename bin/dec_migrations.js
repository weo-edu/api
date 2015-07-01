var mongo = require('mongodb').MongoClient
var url = process.env.MONGO_URL

mongo.connect(url, function(err, db) {
  if(err) throw err

  db.collection('migrations', function(err, migrations) {
    if(err) throw err

    migrations.update({path: 'migrations/.migrate'}, {$inc: {pos: -1}}, function(err) {
      if(err) throw err
      console.log('migrations decremented')
      process.exit()
    })
  })
})