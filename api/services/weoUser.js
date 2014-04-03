var modelHook = require('../../lib/modelHook');

var user = {};

var weoId = 10;
User.findOne(weoId).exec(function(err, u) {
	if (err) throw err;
	if (!u) {
		User.create({
			id: weoId,
			first_name: 'Weo',
			last_name: 'Tips',
			username: 'weotip',
			password: 'elliotTheMang',
			type: 'admin'
		}).done(function(err, u) {
			console.log('err', err);
			_.extend(user, u);
		})
	} else {
		_.extend(user, u);
	}
});

module.exports = user;


modelHook.on('group:create', function(group, next) {
	Event.createAndEmit(user, {
		to: [group.id],
		verb: 'shared',
		type: 'tip',
		visibility: 'teacher',
		payload: {
			code: group.code,
			name: group.name,
			type: 'code'
		}
	}, function(err) {
		if (err) {
			console.error(err.ValidationError);
		}
	});
});