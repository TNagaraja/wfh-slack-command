var googleApi = require('./google-calendar-api');
var slackApi = require('./slack-api');

var scheduleCalendarEvent = (eventId, employeeName, startDateTime, endDateTime) => {
	var action, message;

	if (eventId) {
		action = Promise.resolve();
		if (endDateTime) {
			message = `You're already on the calendar as WFH on ${ startDateTime.format('MMMM Do YYYY') } from ${ startDateTime.format('h:mm a') } to ${ endDateTime.format('h:mm a') }.`;
		} else {
			message = `You're already on the calendar as WFH for ${ startDateTime.format('MMMM Do YYYY') }`;
		}
	} else {
		action = googleApi.createWfhEvent(employeeName, startDateTime, endDateTime);
		if (endDateTime) {
			message = `✅ Okay! You're on the calendar as WFH on ${ startDateTime.format('MMMM Do YYYY') } from ${ startDateTime.format('h:mm a') } to ${ endDateTime.format('h:mm a') }. _Don't slack off_! 🏡`;
		} else {
			message = `✅ Okay! You're on the calendar as WFH for ${ startDateTime.format('MMMM Do YYYY') }. _Don't slack off_! 🏡`;
		}
	}
	return action.then(() => message);
};

var clearCalendarEvent = (eventId, startDateTime, endDateTime) => {
	var action, message;

	if (eventId) {
		action = googleApi.deleteWfhEvent(eventId);
	}
	else {
		action = Promise.resolve();
	}
	if (endDateTime) {
		message = `🚗 Okay! Looks like you're going to the office on ${ startDateTime.format('MMMM Do YYYY') } from ${ startDateTime.format('h:mm a') } to ${ endDateTime.format('h:mm a') }. 🏢`;
	} else {
		message = `🚗 Okay! Looks like you're going to the office ${ startDateTime.format('MMMM Do YYYY') }. 🏢`;
	}

	return action.then(() => message);
};

module.exports = {
	setWfhEvent: function (userID, slackResponseEndpoint, startDateTime, endDateTime) {
		return slackApi
			.getUserInfo(userID)
			.then(employeeName =>
				googleApi.checkIfWfhEventExists(employeeName, startDateTime, endDateTime)
					.then(eventId => scheduleCalendarEvent(eventId, employeeName, startDateTime, endDateTime))
					.then(message => slackApi.sendResponse(slackResponseEndpoint, message))
			)
			.catch(error => {
				console.log(error);
				return slackApi.sendResponse(slackResponseEndpoint, '💥 Uh oh, just FYI, something went wrong and you\'re not on the calendar as WFH.');
			})
	},
	clear: function (userID, slackResponseEndpoint, startDateTime, endDateTime) {
		return slackApi
			.getUserInfo(userID)
			.then(employeeName =>
				googleApi.checkIfWfhEventExists(employeeName, startDateTime, endDateTime)
					.then(eventId => clearCalendarEvent(eventId, startDateTime))
					.then(message => slackApi.sendResponse(slackResponseEndpoint, message))
			);
	}
};
