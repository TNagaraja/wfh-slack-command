var googleApi = require('./google-calendar-api');
var slackApi = require('./slack-api');

var toggleWfhEvent = (eventId, employeeName, date) => {
	var action, message;

	if (eventId) {
		action = googleApi.deleteWfhEvent(eventId);
		message = '🚗 Okay! Looks like you\'re going to the office today. 🏢';
	} else {
		action = googleApi.createWfhEvent(employeeName, date);
		message = '✅ Okay! You\'re on the calendar as WFH today. _Don\'t slack off_! 🏡';
	}

	return action.then(() => message);
};

var clearCalendarEvent = eventId => {
	var action, message;

	if (eventId) {
		action = googleApi.deleteWfhEvent(eventId);
	}
	else {
		action = Promise.resolve();
	}
	message = '🚗 Okay! Looks like you\'re going to the office today. 🏢';

	return action.then(() => message);
}

module.exports = {
	handleRequest: function (userID, slackResponseEndpoint, date) {
		return slackApi
			.getUserInfo(userID)
			.then(employeeName =>
				googleApi.checkIfWfhEventExists(employeeName, date)
					.then(eventId => toggleWfhEvent(eventId, employeeName, date))
					.then(message => slackApi.sendResponse(slackResponseEndpoint, message))
			)
			.catch(error => {
				console.log(error);
				return slackApi.sendResponse(slackResponseEndpoint, '💥 Uh oh, just FYI, something went wrong and you\'re not on the calendar as WFH.');
			})
	},
	clear: function (userID, slackResponseEndpoint, date) {
		return slackApi
			.getUserInfo(userID)
			.then(employeeName =>
				googleApi.checkIfWfhEventExists(employeeName, date)
					.then(eventId => clearCalendarEvent(eventId))
					.then(message => slackApi.sendResponse(slackResponseEndpoint, message))
			);
	}
};
