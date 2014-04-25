module.exports = function(chai, utils) {
  chai.Assertion.addMethod('ValidationError',
  function(path, type, message, value) {
    new chai.Assertion(this._obj).to.have.status(400);
    new chai.Assertion(this._obj.body.name)
      .to.equal('ValidationError');

    var error = {path: path};
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