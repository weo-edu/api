var Analytics = require('analytics-node')
var is = require('@weo-edu/is')
var prep = require('track-prep')

var SEGMENT_API_KEY = require('lib/config').segment

var analytics = module.exports =  new Analytics(SEGMENT_API_KEY)

analytics.middleware = function (name, props) {
  var propsFn = props
  if (is.array(props)) {
    propsFn = function (obj) {
      return prep(obj, props)
    }
  } else if (is.string(props)) {
    propsFn = function (obj) {
      return prep[props](obj)
    }
  }

  return function (req, res, next) {
    var properties = propsFn && propsFn(req.body)

    analytics.track({
      userId: req.me && req.me.id,
      event: name,
      properties: properties
    })

    next()
  }
}
