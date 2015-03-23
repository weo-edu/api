let mu = require('mu-js');
let co = require('co');

exports.io = co(function *(specs) {
  let output = {};

  Object.keys(specs).forEach(function(prop) {
    let {app: app, method: method, path: path, body: body} = specs[prop];
    output[prop] = yield mu.request(app)[method](path, body);
  });

  return output;
});

let verbs = ['get', 'put', 'post', 'patch', 'delete'];

exports.request = function(app) {
  let spec = {app: app};
  let methods = {};

  verbs.forEach(function(verb) {
    memo[verb] = method.bind(spec, verb);
  });

  return methods;
};

function method(methodName, path, body) {
  this.method = methodName;
  this.path = path;
  this.body = body;
  return this;
};