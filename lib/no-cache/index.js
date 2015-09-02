/**
 * Vars
 */

var exclude = /^\/(?:assets|avatar)/

/**
 * Cache disabling middleware
 */

function nocache (req, res, next) {
  if (!exclude.test(req.path)) {
    res.header("Cache-Control", "no-cache, no-store, must-revalidate")
    res.header("Pragma", "no-cache")
    res.header("Expires", 0)
  }

  next()
}

/**
 * Exports
 */

module.exports = nocache