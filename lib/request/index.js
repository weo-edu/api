const mu = require('mu-js');
const R = require('ramda');
const prop = require('prop');

const request = R.curryN(3, function(verb, app, path, ...rest) {
  return mu.request(app)[verb](path, ...rest);
});

const verbs = ['get', 'put', 'patch', 'del', 'post'];
const {get, put, post, patch, del}
  = zipObj(verbs, verbs.map(verb => request(verb)));

/**
 * Takes a request method and returns a version
 * of that request method that accepts id as a
 * parameter and generates a path of the form `/${id}`
 *
 * Example:
 *
 * const getUserById = byId(get(users))
 */
idPath = id => '/' + id;
function byId(method) {
  return R.curryN(method.length, method.length === 3
    ? R.useWith(method, R.identity, idPath)
    : R.useWith(method, idPath));
}

/**
 * Takes a request method that accepts an id as its first
 * parameter (e.g. a byId method) and returns a version that
 * operates on a descriptor (i.e. an object of the form
 * {id: <id>}).
 *
 * Example:
 *
 * const setPref = put(users, (id, name) => `/${id}/preference/${name}/`)
 * const setPrefByDescriptor = byDescriptor(setPref)
 */
function byDescriptor(method) {
  return R.curryN(method.length, method.length === 3
    ? R.useWith(method, R.identity, prop('id'))
    : R.useWith(method, prop('id')));
}


const getById = byId(get);
const putById = byId(put);
const delById = byId(del);

/**
 * Every function exported here expects a mu app as its first
 * parameter.  E.g.
 *
 * getById(users, id)
 *
 * But it is autocurried, so you may do:
 *
 * getUserById = getById(users)
 */
module.exports = {
  // Request functions
  get,
  put,
  post,
  patch,
  del,
  getById,
  putById,
  delById,

  // Meta functions that operate on
  // request functions
  byId,
  byDescriptor,

  app: function(app) {
    return mapObj(fn => fn(app), {get, put, post, patch, del, getById, putById, delById}));
  }
};