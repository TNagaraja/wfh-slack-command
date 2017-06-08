var googleAuth = require('./google-auth-api');
var google = require('googleapis');
var calendar = google.calendar('v3').events;

function credentials() {
	return googleAuth.credentials(process.env.GOOGLE_CLIENT_EMAIL, process.env.GOOGLE_PRIVATE_KEY);
}

function addDay(date) {
	return date.clone().add(1, 'day').startOf('day');
}

module.exports = {
	checkIfWfhEventExists: (employeeName, eventStartDateTime, eventEndDateTime = addDay(eventStartDateTime)) => {
			return new Promise(resolve =>
				credentials().then(auth =>
					calendar.list({
						auth,
						calendarId: process.env.GOOGLE_CLIENT_EMAIL,
						singleEvents: true,
						timeMin: eventStartDateTime.format(),
						timeMax: eventEndDateTime.format(),
						timeZone: eventStartDateTime.tz()
					}, (err, response) => {
						var existingId;

					if (response) {
						existingId = response.items
							.filter(i => i.summary === `${ employeeName } - WFH`)
							.map(i => i.id)[0];
					}

					resolve(existingId);
				})
			)
		);
	},
	deleteWfhEvent: eventId => {
		return new Promise((resolve, reject) =>
			credentials().then(auth =>
				calendar.delete({
					auth,
					calendarId: process.env.GOOGLE_CLIENT_EMAIL,
					eventId
				}, error => {
					if (error) {
						reject(error);
					}
					else {
						resolve();
					}
				})
			)
		);
	},
	createWfhEvent: (employeeName, eventStartDateTime, eventEndDateTime) => {
		if (eventEndDateTime) {
			return new Promise((resolve, reject) =>
				credentials().then(auth =>
					calendar.insert({
						auth,
						calendarId: 'primary',
						resource: {
							attendees: [{ email: process.env.GOOGLE_TARGET_CALENDAR }],
							description: 'Added by your friendly, neighborhood Slackbot 🏡',
							end: { dateTime: eventEndDateTime.format() },
							start: { dateTime: eventStartDateTime.format() },
							summary: `${ employeeName } - WFH`
						}
					}, (err, response) => {
						if (err) {
							reject(err);
						}
						else {
							resolve(response);
						}
					})
				)
			);
		} else {
			return new Promise((resolve, reject) =>
				credentials().then(auth =>
					calendar.insert({
						auth,
						calendarId: 'primary',
						resource: {
							attendees: [{ email: process.env.GOOGLE_TARGET_CALENDAR }],
							description: 'Added by your friendly, neighborhood Slackbot 🏡',
							end: { date: addDay(eventStartDateTime).format('YYYY-MM-DD') },
							start: { date: eventStartDateTime.format('YYYY-MM-DD') },
							summary: `${ employeeName } - WFH`
						}
					}, (err, response) => {
						if (err) {
							reject(err);
						}
						else {
							resolve(response);
						}
					})
				)
			);
		}
	}
};