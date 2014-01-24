module.exports = function(chai, utils) {
  chai.Assertion.addMethod('ValidationError', 
  function(code, field, resource) {
    new chai.Assertion(this._obj).to.have.status(401);
    new chai.Assertion(this._obj.body.message)
      .to.equal('ValidationError');

    var error = {code: code, field: field};
    if(arguments.length > 2)
      error.resource = resource;

    new chai.Assertion(this._obj.body.errors)
      .to.contain.an.item.with
      .properties(error);
  });

  // chai.Assertion.addMethod('properties', function(properties) {
  //   var deep = !! this.flag('deep')
  //     , obj = this._obj;
    
  //   this.assert(_.all(properties, function(val, key) {
  //     return obj.hasOwnProperty(key) && 
  //       (deep ? _.isEqual(obj[key], val) : obj[key] === val);
  //   }), 'expected #{this} to have properties ' + utils.inspect(properties)
  //     , 'expected #{this} not to have properties ' + utils.inspect(properties));
  // });
};

// _.each(['invalid', 'missing', 'missing_field', 'already_exists'], 
// function(code) {
//   chai.Assertion.addMethod(code, function(field) {
//     this.assert(
//       this._obj.code === code 
//         && this._obj.field === field
//       , 'expected #{this} to be an error with code {#exp} and field {#act}'
//       , 'expected #{this} not to be an error with code {#exp} and field {#act}'
//       , code
//       , field);
//   });
// });

// function hasError(error) {
//   var errors this._obj.body.errors;
//   this.assert(
//     _.any(errors, function(err) {
//       return _.isEqual(err, error);
//     }),
//     'expected #{exp} '

// }

// function chainError() {

// }
// chai.Assertion.addChainableMethod('error', 