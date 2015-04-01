const app = require('lib/mu-group');
const request = require('lib/request');
const {byDescriptor, byId} = request;
const io = require('io');
const group = module.exports = request.app(app);


/**
 * Takes a group and returns an array containing
 * the ids of that group's owners
 *
 * @group {Group}
 *
 */
group.ownerIds = compose(map(prop('id')), prop('owners'));
group.ownersOf = io(compose(map(user.getById), group.ownerIds));
