var request = require('superagent')
var scraperUrl = require('lib/config').scraperUrl
var _ = require('lodash')

function makeUrl(opts) {
  return scraperUrl + '?' + _.map(opts, function(val, key) {
    return encodeURIComponent(key) + '=' + encodeURIComponent(val)
  }).join('&')
}

function convertFromOembed (oembed) {
  var image = {}
  var type = oembed.type
  if(oembed.type === 'image' || oembed.type === 'photo') {
    image.url = oembed.image
    image.width = oembed.width
    image.height = oembed.height
    type = 'image'
  } else {
    image.url = oembed.thumbnail_url
    image.width = oembed.thumbnail_width
    image.height = oembed.thumbnail_height
  }

  return {
    providerName: oembed.provider_name,
    objectType: type,
    image: image,
    content: oembed.html || oembed.title,
    description: oembed.description,
    displayName: oembed.title,
    embed: {
      url: oembed.url,
      type: type
    }
  }
}

module.exports = function(url, opts, cb) {
  if('function' === typeof opts) {
    cb = opts
    opts = null
  }

  opts = _.defaults(opts || {}, {
    autoplay: true,
    maxwidth: 530,
    url: url
  })

  request
    .get(makeUrl(opts))
    .end(function(err, res) {
      if(err || res.status !== 200) {
        return cb(err || res.body)
      }

      var data = convertFromOembed(res.body)
      if(! data.embed.url) data.embed.url = opts.url
      cb(null, data)
    })
}
