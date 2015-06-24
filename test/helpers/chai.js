module.exports = function(chai, utils) {
  chai.Assertion.addMethod('ValidationError',
  function(path, type, message, value, subPath) {
    new chai.Assertion(this._obj).to.have.status(400);

    var error = {path: subPath || path};
    if(arguments.length > 1)
      error.type = type;
    if(arguments.length > 2)
      error.message = message;
    if(arguments.length > 3)
      error.value = value;

    new chai.Assertion(this._obj.body.errors[path])
      .to.have.properties(error);
  });
};