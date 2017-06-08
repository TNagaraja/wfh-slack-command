var Chance = require('chance');
var chai = require('chai');
var moment = require('moment');
var rewire = require('rewire');
var sinon = require('sinon');

chai.use(require('chai-as-promised'));

var chance = new Chance();
var expect = chai.expect;
var googleApiWrapper = rewire('../src/google-calendar-api');
var fakeCalendarApi = {};

googleApiWrapper.__set__({
	credentials: sinon.stub().resolves({}),
	calendar: fakeCalendarApi
});

describe('Google Calendar API', () => {
	var clientEmail, targetCalendar, date;

	before(() => {
		clientEmail = chance.email();
		targetCalendar = chance.email();
		process.env.GOOGLE_CLIENT_EMAIL = clientEmail;
		process.env.GOOGLE_TARGET_CALENDAR = targetCalendar;
		date = moment(chance.date({ year: 2017 }));
	});

	describe('Checking if an existing WFH event exists', () => {
		describe('And we want to see if a WFH event exists on a specified date', () => {
			var apiResponse, employeeName, resolvedResult;
			var act = () => resolvedResult = googleApiWrapper.checkIfWfhEventExists(employeeName, date);

			beforeEach(() => {
				apiResponse = {};
				employeeName = chance.name();
				fakeCalendarApi.list = sinon.stub().callsArgWith(1, null, apiResponse);
			});

			describe('And there is already an event with a summary matching the event template like "Person - WFH"', () => {
				var eventId;

				beforeEach(() => {
					eventId = chance.string();
					apiResponse.items = [{ id: eventId, summary: `${ employeeName } - WFH` }];
					return act();
				});

				it('should pass in the GOOGLE_CLIENT_EMAIL environmental variable as the "calendarId"', () =>
					expect(fakeCalendarApi.list.firstCall.args[0].calendarId).to.equal(clientEmail)
				);

				it('should set the "timeMin" to event date', () =>
					expect(moment(fakeCalendarApi.list.firstCall.args[0].timeMin).isSame(date, 'day')).to.equal(true)
				);

				it('should set the "timeMax" parameter to day after event date', () =>
					expect(moment(fakeCalendarApi.list.firstCall.args[0].timeMax).isSame(date.add(1, 'day'), 'day')).to.equal(true)
				);

				it('should find that event ID', () =>
					expect(resolvedResult).to.eventually.equal(eventId)
				);
			});

			describe('And there is not already a WFH event', () => {
				beforeEach(() => {
					apiResponse.items = [{ id: chance.string(), summary: `${ chance.name({ middle: true }) } - WFH` }];
					return act();
				});

				it('should not find that event', () => {
					expect(resolvedResult).to.eventually.not.be.ok
				});
			});
		});
		describe('And we want to see if a WFH event exists in a time interval', () => {
			var apiResponse, employeeName, resolvedResult, startDateTime, endDateTime;
			var act = () => resolvedResult = googleApiWrapper.checkIfWfhEventExists(employeeName, startDateTime, endDateTime);

			beforeEach(() => {
				apiResponse = {};
				employeeName = chance.name();
				fakeCalendarApi.list = sinon.stub().callsArgWith(1, null, apiResponse);
			});
			describe('And there is already an event with a summary matching the event template like "Person - WFH"', () => {
			var eventId;

			beforeEach(() => {
				eventId = chance.string();
				apiResponse.items = [{ id: eventId, summary: `${ employeeName } - WFH` }];
				startDateTime = moment(chance.date({ year: 2017 }));
				endDateTime = moment(chance.date({ year: 2017 }));
				return act();
			});

			it('should pass in the GOOGLE_CLIENT_EMAIL environmental variable as the "calendarId"', () =>
				expect(fakeCalendarApi.list.firstCall.args[0].calendarId).to.equal(clientEmail)
			);

			it('should set the "timeMin" to the start time', () =>
				sinon.assert.match(moment(fakeCalendarApi.list.firstCall.args[0].timeMin).isSame(startDateTime, 'minute'), true)
			);

			it('should set the "timeMax" parameter to the end time', () =>
				sinon.assert.match(moment(fakeCalendarApi.list.firstCall.args[0].timeMax).isSame(endDateTime, 'minute'), true)
			);

			it('should find that event ID', () =>
				expect(resolvedResult).to.eventually.equal(eventId)
			);
		});

			describe('And there is not already a WFH event', () => {
				beforeEach(() => {
					apiResponse.items = [{ id: chance.string(), summary: `${ chance.name({ middle: true }) } - WFH` }];
					startDateTime = moment(chance.date({ year: 2017 }));
					endDateTime = moment(chance.date({ year: 2017 }));
					return act();
				});

				it('should not find that event', () => {
					expect(resolvedResult).to.eventually.not.be.ok
				});
			});
		});
	});

	describe('Deleting a WFH event', () => {
		var error, eventId;
		var act = () => googleApiWrapper.deleteWfhEvent(eventId);

		beforeEach(() => {
			eventId = chance.string();
		});

		describe('And the event exists', () => {
			beforeEach(() => {
				fakeCalendarApi.delete = sinon.stub().callsArg(1);
				return act();
			});

			it('should pass in the GOOGLE_CLIENT_EMAIL environmental variable as the "calendarId"', () =>
				expect(fakeCalendarApi.list.firstCall.args[0].calendarId).to.equal(clientEmail)
			);

			it('should call the Google API with the event ID', () =>
				expect(fakeCalendarApi.delete.firstCall.args[0].eventId).to.equal(eventId)
			);
		});

		describe('And the event doesn\'t exist or the API errors out', () => {
			beforeEach(() => {
				error = {};
				fakeCalendarApi.delete = sinon.stub().callsArgWith(1, error);
			});

			it('should reject the returned Promise with the error', () =>
				expect(act()).to.be.rejectedWith(error)
			);
		});
	});

	describe('Creating a WFH event', () => {
		var employeeName, resolvedResult;
		describe('And there is not a time interval', () => {
			var act = () => resolvedResult = googleApiWrapper.createWfhEvent(employeeName, date);

			beforeEach(() => {
				employeeName = chance.name();
			});

			describe('And the event creation succeeds', () => {
				beforeEach(() => {
					fakeCalendarApi.insert = sinon.stub().callsArg(1, null, {});
					return act();
				});

				it('should pass in "primary" as the "calendarId"', () =>
					expect(fakeCalendarApi.insert.firstCall.args[0].calendarId).to.equal('primary')
				);

				it('should add the GOOGLE_TARGET_CALENDAR environmental variable as an attendee', () => {
					var attendees = fakeCalendarApi.insert.firstCall.args[0].resource.attendees;
					expect(attendees).to.have.length(1);
					expect(attendees[0]).to.have.property('email', targetCalendar);
				});

				it('should resolve the returned promise', () =>
					expect(resolvedResult).to.eventually.be.fulfilled
				)

				it('should set the start date to the date of the event date day', () =>
					expect(moment(fakeCalendarApi.insert.firstCall.args[0].resource.start.date).isSame(date, 'day')).to.equal(true)
				);

				it('should set the end time to the day after event date', () =>
					expect(moment(fakeCalendarApi.insert.firstCall.args[0].resource.end.date).isSame(date.add(1, 'day'), 'day')).to.equal(true)
				);

				it('should set the summary to the employee\'s name plus "WFH"', () =>
					expect(fakeCalendarApi.insert.firstCall.args[0].resource.summary).to.equal(`${ employeeName } - WFH`)
				);
			});

			describe('And the event doesn\'t exist or the API errors out', () => {
			var error;
				beforeEach(() => {
					error = {};
					fakeCalendarApi.insert = sinon.stub().callsArgWith(1, error);
				});

				it('should reject the returned Promise with the error', () =>
					expect(act()).to.be.rejectedWith(error)
				);
			});
		});
		describe('And there is a time interval ', () => {
			var startDateTime, endDateTime;
			var act = () => resolvedResult = googleApiWrapper.createWfhEvent(employeeName, startDateTime, endDateTime);
			describe('And the event creation succeeds', () => {
				beforeEach(() => {
					fakeCalendarApi.insert = sinon.stub().callsArg(1, null, {});
					startDateTime = moment(chance.date({ year: 2017 }));
					endDateTime = moment(chance.date({ year: 2017 }));
					return act();
				});

				it('should pass in "primary" as the "calendarId"', () =>
					expect(fakeCalendarApi.insert.firstCall.args[0].calendarId).to.equal('primary')
				);

				it('should add the GOOGLE_TARGET_CALENDAR environmental variable as an attendee', () => {
					var attendees = fakeCalendarApi.insert.firstCall.args[0].resource.attendees;
					expect(attendees).to.have.length(1);
					expect(attendees[0]).to.have.property('email', targetCalendar);
				});

				it('should resolve the returned promise', () =>
					expect(resolvedResult).to.eventually.be.fulfilled
				)

				it('should set the start time to the specified start time', () =>
						sinon.assert.match(moment(fakeCalendarApi.insert.firstCall.args[0].resource.start.dateTime).isSame(startDateTime, 'minute'), true)
				);

				it('should set the end time to the specified end time', () =>
						sinon.assert.match(moment(fakeCalendarApi.insert.firstCall.args[0].resource.end.dateTime).isSame(endDateTime, 'minute'), true)
				);

				it('should set the summary to the employee\'s name plus "WFH"', () =>
					expect(fakeCalendarApi.insert.firstCall.args[0].resource.summary).to.equal(`${ employeeName } - WFH`)
				);
			});

			describe('And the event doesn\'t exist or the API errors out', () => {
			var error;
				beforeEach(() => {
					error = {};
					fakeCalendarApi.insert = sinon.stub().callsArgWith(1, error);
				});

				it('should reject the returned Promise with the error', () =>
					expect(act()).to.be.rejectedWith(error)
				);
			});
		});
	});
});