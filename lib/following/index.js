/**
 * Imports
 */
var mongo = require('lib/mongo')
var asArray = require('as-array')
var assign = require('object-assign')
var mongoose = require('mongoose')
var getProp = require('@f/get-prop')
/**
 * Vars
 */
var edges
mongo.connect.then(function() {
  edges = mongo.collection('edges')
})

/**
 * Following
 */

function follow (src, dest, metadata) {
  var User = mongoose.model('User')
  User.findById(src.id, function(err, user) {
    if(!getProp('preferences.onboard.follow', user)) {
      user.setPreference('onboard.follow', true)
      user.save()
    }
  })
  return edges
    .findOne({
      edgeType: 'follow',
      'src.id': src.id,
      'dest.id': dest.id
    })
    .then(function(edge) {
      if(edge) {
        if(! metadata) return
        return edges
          .findOne({_id: edge._id})
          .set('metadata', assign({}, edge.metadata || {}, metadata))
      }

      return edges.insert({
        src: src,
        dest: dest,
        edgeType: 'follow',
        metadata: metadata || {}
      })
    })
}

function unfollow (srcId, destId) {
  return edges.remove({
    edgeType: 'follow',
    'src.id': srcId,
    'dest.id': destId
  })
}

function followers (id) {
  return edges.find({
    edgeType: 'follow',
    'dest.id': id
  })
}

function following (id, filter) {
  var query = {
    edgeType: 'follow',
    'src.id': id
  }

  if (filter) {
    query['dest.id'] = {$in: asArray(filter)}
  }

  return edges.find(query)
}

function followingUsers (id, filter) {
  var query = {
    edgeType: 'follow',
    'src.id': id,
    'metadata.user': {$exists: true}
  }

  if (filter) {
    query['dest.id'] = {$in: asArray(filter)}
  }

  return edges.find(query)
}

/**
 * Exports
 */

module.exports = {
  follow: follow,
  unfollow: unfollow,
  followers: followers,
  following: following,
  followingUsers: followingUsers
}
