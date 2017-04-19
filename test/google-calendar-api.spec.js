var Chance = require('chance');
var chai = require('chai');
var mocha = require('mocha');
var rewire = require('rewire');
var sinon = require('sinon');
var Promise = require('bluebird');
var moment = require('moment');

chai.use(require('chai-as-promised'));

var chance = new Chance();
var expect = chai.expect;
var googleApiWrapper = rewire('../src/google-calendar-api');
var fakeCalendarApi = {};

googleApiWrapper.__set__({
	credentials: Promise.resolve({}),
	calendar: fakeCalendarApi
});

describe('Google Calendar API', () => {
	var clientEmail, targetCalendar;

	before(() => {
		clientEmail = chance.email();
		targetCalendar = chance.email();
		process.env.GOOGLE_CLIENT_EMAIL = clientEmail;
		process.env.GOOGLE_TARGET_CALENDAR = targetCalendar;
	});

	describe('Checking if an existing WFH event exists', () => {
		var apiResponse, employeeName, resolvedResult;
		var act = () => resolvedResult = googleApiWrapper.checkIfWfhEventExists(employeeName);

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

			it('should pass in the GOOGLE_CLIENT_EMAIL environmental variable as the "calenderId"', () =>
				expect(fakeCalendarApi.list.firstCall.args[0].calendarId).to.equal(clientEmail)
			);

			it('should set the "timeMin" to today', () =>
				expect(moment(fakeCalendarApi.list.firstCall.args[0].timeMin).isSame(moment(), 'day')).to.equal(true)
			);

			it('should set the "timeMax" parameter to tomorrow', () =>
				expect(moment(fakeCalendarApi.list.firstCall.args[0].timeMax).isSame(moment().add(1, 'day'), 'day')).to.equal(true)
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

	describe('Deleting a WFH event', () => {
		var error, apiResponse, eventId, resolvedResult;
		var act = () => resolvedResult = googleApiWrapper.deleteWfhEvent(eventId);

		beforeEach(() => {
			apiResponse = {};
			eventId = chance.string();
		});

		describe('And the event exists', () => {
			beforeEach(() => {
				fakeCalendarApi.delete = sinon.stub().callsArg(1);
				return act();
			});

			it('should pass in the GOOGLE_CLIENT_EMAIL environmental variable as the "calenderId"', () =>
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
		var resolvedResult;
		var act = () => resolvedResult = googleApiWrapper.createWfhEvent(employeeName);

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

			it('should set the start time to today', () =>
				expect(moment(fakeCalendarApi.insert.firstCall.args[0].resource.start.date).isSame(moment(), 'day')).to.equal(true)
			);

			it('should set the end time to tomorrow', () =>
				expect(moment(fakeCalendarApi.insert.firstCall.args[0].resource.end.date).isSame(moment().add(1, 'day'), 'day')).to.equal(true)
			);

			it('should set the summary to the employee\'s name plus "WFH"', () =>
				expect(fakeCalendarApi.insert.firstCall.args[0].resource.summary).to.equal(`${ employeeName } - WFH`)
			);
		});

		describe('And the event doesn\'t exist or the API errors out', () => {
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