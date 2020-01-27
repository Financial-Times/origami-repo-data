'use strict';

exports.up = async database => {
	const versions = await database.select().from('versions');
	for (const version of versions) {
		if (version.support_channel === '#ft-origami') {
			await database('versions').where('id', version.id).update({
				support_channel: '#origami-support'
			});
		}
	}
};

exports.down = async database => {
	const versions = await database.select().from('versions');
	for (const version of versions) {
		if (version.support_channel === '#origami-support') {
			await database('versions').where('id', version.id).update({
				support_channel: '#ft-origami'
			});
		}
	}
};
