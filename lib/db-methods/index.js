const {curryN, useWith, __, zipObj} = require('ramda');
const methods = ['findOne', 'find', 'update', 'insert', 'remove'];
const {findOne, find, update, insert, remove}
  = zipObj(methods, methods.map(function(method) {
      return curryN(3, function(collection, ...args) {
        return collection[method](...args);
      });
    }));

const by = curryN(3, function(method, path, value, ...rest) {
  return method({[path]: value}, ...rest);
});

const byId = by(__, 'id');

module.exports = {
  findOne,
  find,
  update,
  insert,
  remove,
  by,
  byId,
  findBy: useWith(by, find),
  findOneBy: useWith(by, findOne),
  findOneById: useWith(byId, findOne),
  updateBy: useWith(by, update),
  updateById: useWith(byId, update),
  removeBy: useWith(by, remove),
  removeById: useWith(byId, remove)
};