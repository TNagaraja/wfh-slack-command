var googleApi = require('./google-calendar-api');
var slackApi = require('./slack-api');
var moment = require('moment');

var toggleWfhEvent = (eventId, employeeName, date) => {
	var action, message;

	if (eventId) {
		action = googleApi.deleteWfhEvent(eventId);
		message = `🚗 Okay! Looks like you're going to the office on ${ moment(date).format('MMMM Do YYYY') }. 🏢`;
	} else {
		action = googleApi.createWfhEvent(employeeName, date);
		message = `✅ Okay! You're on the calendar as WFH for ${ moment(date).format('MMMM Do YYYY') }. _Don't slack off_! 🏡`;
	}

	return action.then(() => message);
};

var toggleWfhEventInInterval = (eventId, employeeName, startDateTime, endDateTime) => {
	var action, message;

	if (eventId) {
		action = googleApi.deleteWfhEvent(eventId);
		if (startDateTime.getDate() === endDateTime.getDate())
		{
			message = `🚗 Okay! Looks like you're going to the office on ${ moment(startDateTime).format('MMMM Do YYYY') } from ${ moment(startDateTime).format('h:mm a') } to ${ moment(endDateTime).format('h:mm a') }. 🏢`
		}
		else
		{
			message = `🚗 Okay! Looks like you're going to the office from ${ moment(startDateTime).format('MMMM Do YYYY, h:mm a') } to ${ moment(endDateTime).format('MMMM Do YYYY, h:mm a') } . 🏢`
		}
	} else {
		action = googleApi.createWfhEvent(employeeName, startDateTime, endDateTime);
		if (startDateTime.getDate() === endDateTime.getDate())
		{
			message = `✅ Okay! You're on the calendar as WFH on ${ moment(startDateTime).format('MMMM Do YYYY') } from ${ moment(startDateTime).format('h:mm a') } to ${ moment(endDateTime).format('h:mm a') }. _Don't slack off_! 🏡`
		}
		else
		{
			message = `✅ Okay! You're on the calendar as WFH from ${ moment(startDateTime).format('MMMM Do YYYY, h:mm a') } to ${ moment(endDateTime).format('MMMM Do YYYY, h:mm a') }. _Don't slack off_! 🏡`;
		}
	}

	return action.then(() => message);
};

var clearCalendarEvent = (eventId, date) => {
	var action, message;

	if (eventId) {
		action = googleApi.deleteWfhEvent(eventId);
	}
	else {
		action = Promise.resolve();
	}
	message = `🚗 Okay! Looks like you're going to the office ${ moment(date).format('MMMM Do YYYY') }. 🏢`;

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
	handleRequestInInterval: function (userID, slackResponseEndpoint, startDateTime, endDateTime) {
		return slackApi
			.getUserInfo(userID)
			.then(employeeName =>
				googleApi.checkIfWfhEventExists(employeeName, startDateTime, endDateTime)
					.then(eventId => toggleWfhEventInInterval(eventId, employeeName, startDateTime, endDateTime))
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
					.then(eventId => clearCalendarEvent(eventId, date))
					.then(message => slackApi.sendResponse(slackResponseEndpoint, message))
			);
	}
};
