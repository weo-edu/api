/**
 * Modules
 */
const io = require('io');

/**
 * Libs
 */
const app = require('lib/mu-group');
const request = require('lib/request');
const hashid = require('lib/hashid');
const ramda = require('ramda');

/**
 * Vars
 */
const {compose, prop, map, useWith} = ramda;
const {byDescriptor, byId} = request;
const subgroupsPath = id => `/${id}/subgroups`;

/**
 * Exports
 */
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

group.subgroupsOf = useWith(get, compose(subgroupsPath, prop('id')));

group.generateCode = hashid(config.hash.alphabet, config.hash.length);