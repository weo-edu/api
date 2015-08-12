var mongo = require('lib/mongo')

exports.getShares = function(req, res, next) {
  var page = req.page
  var text = req.param('query') || ''
  var shares = mongo.raw.collection('shares')

  var options = {
      published: true,
      $text: {$search: text},
      'contexts.descriptor.id': 'public'
    }

  if (req.me) {
    options['actor.id'] = req.me.id
    console.log(options)
  }


  shares.find(options,
    {score: {$meta: 'textScore'}}
  )
  .sort({score: {$meta: 'textScore'}})
  .skip(page.skip)
  .limit(page.limit)
  .toArray(function(err, shares) {
    if (err) return next(err)
    res.json(shares)
  })
}

exports.getBoards = function(req, res, next) {
  var page = req.page
  var text = req.param('query') || ''

  var groups = mongo.raw.collection('groups')
  groups.find(
    {
      $text: {$search: text},
      groupType: 'board',
      status: 'active'
    },
      {score: {$meta: 'textScore'}}
    )
    .sort({score: {$meta: 'textScore'}})
    .skip(page.skip)
    .limit(page.limit)
    .toArray(function(err, boards) {
      if (err) return next(err)
      res.json(boards)
    })
}


exports.getPeople = function(req, res, next) {
  var page = req.page
  var text = req.param('query') || ''

  var users = mongo.raw.collection('users')
  users.find(
    {
      $text: {$search: text},
      userType: 'teacher'
    },
      {score: {$meta: 'textScore'}}
    )
    .sort({score: {$meta: 'textScore'}})
    .skip(page.skip)
    .limit(page.limit)
    .toArray(function(err, users) {
      if (err) return next(err)
      res.json(users)
    })
}