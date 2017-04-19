var googleApi = require('./google-calendar-api');
var slackApi = require('./slack-api');

var toggleWfhEvent = (eventId, employeeName) => {
	var action, message;

	if (eventId) {
		action = googleApi.deleteWfhEvent(eventId);
		message = '🚗 Okay! Looks like you\'re going to the office today. 🏢';
	} else {
		action = googleApi.createWfhEvent(employeeName);
		message = '✅ Okay! You\'re on the calendar as WFH today. _Don\'t slack off_! 🏡';
	}

	return action.then(() => message);
};

module.exports = (userId, slackResponseEndpoint) =>
	slackApi.getUserInfo(userId)
		.then(employeeName =>
			googleApi.checkIfWfhEventExists(employeeName)
				.then(eventId => toggleWfhEvent(eventId, employeeName))
				.then(message => slackApi.sendResponse(slackResponseEndpoint, message))
		)
		.catch(error => {
			console.log(error);
			return slackApi.sendResponse(slackResponseEndpoint, '💥 Uh oh, just FYI, something went wrong and you\'re not on the calendar as WFH.');
		})