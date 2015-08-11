module.exports = function(res, path, type, msg, value, subPath) {
  if(res.status !== 400)
    return false

  var args = [].slice.call(arguments)
  return Object.keys(res.body.errors).some(function(key) {
    var error = res.body.errors[key]

    if(error.path !== (subPath || path))
      return false
    if(args.length > 2 && error.type !== type)
      return false
    if(args.length > 3 && error.message !== msg)
      return false
    if(args.length > 4 && error.value !== value)
      return false

    return true
  })
}