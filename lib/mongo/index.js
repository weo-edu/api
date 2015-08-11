/**
 * Modules
 */

var mongodb = require('mongodb-next')

/**
 * Locals
 */

var config = require('lib/config')

/**
 * Expos db
 */

var db = module.exports = mongodb(config.mongo)


db.connect.then(function() {

  /**
   * Edges
   */

  var edges = db.collection('edges')
  edges.collection.ensureIndex({src: 1, edgeType: 1, createdAt: -1}, function(err) {
    if (err)
      throw err
  })

  edges.collection.ensureIndex({src: 1, edgeType: 1, dest: 1}, function(err) {
    if (err)
      throw err
  })
})