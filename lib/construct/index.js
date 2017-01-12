module.exports = function (Model, data) {
  var discriminators = Model.discriminators
  var key = Model.schema.options.discriminatorKey

  if (discriminators && discriminators[data[key]]) {
    return new (discriminators[data[key]])(data)
  }

  return new Model(data)
}
