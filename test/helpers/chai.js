module.exports = function(chai, utils) {
  chai.Assertion.addMethod('ValidationError',
  function(code, field, resource, details) {
    new chai.Assertion(this._obj).to.have.status(400);
    new chai.Assertion(this._obj.body.message)
      .to.equal('ValidationError');

    var error = {code: code, field: field};
    if(arguments.length > 2)
      error.resource = resource;
    if(arguments.length > 3)
      error.details = details;

    new chai.Assertion(this._obj.body.errors)
      .to.contain.an.item.with
      .properties(error);
  });
};