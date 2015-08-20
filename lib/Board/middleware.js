/**
 * Middleware
 */

function setGroupType (req, res, next) {
  req.body.groupType = 'board'
  next()
}

/**
 * Exports
 */

module.exports = {
  setGroupType: setGroupType
}
