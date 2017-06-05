var Chance = require('chance');
var chai = require('chai');
var rewire = require('rewire');
var sinon = require('sinon');
var moment = require('moment');

chai.use(require('chai-as-promised'));

var chance = new Chance();
var handleWfhRequest = rewire('../src/handle-wfh-request');

describe('Handling a WFH request', () => {
	var fakeSlackApi, fakeGoogleApi, slackResponseEndpoint, userId, date, startDateTime, endDateTime;
	var refreshMocks = () => {
		fakeSlackApi = {
			getUserInfo: sinon.stub(),
			sendResponse: sinon.stub()
		};

		fakeGoogleApi = {
			createWfhEvent: sinon.stub(),
			checkIfWfhEventExists: sinon.stub(),
			deleteWfhEvent: sinon.stub()
		};

		handleWfhRequest.__set__({
			credentials: sinon.stub().resolves({}),
			slackApi: fakeSlackApi,
			googleApi: fakeGoogleApi
		});
	};

	beforeEach(() => {
		userId = chance.string();
		slackResponseEndpoint = chance.url();
		date = moment(chance.date());
		startDateTime = moment(chance.date());
		endDateTime = moment(chance.date());
		refreshMocks();
	});
	describe('When processing a request to set a WFH event', () => {
		var act = () => handleWfhRequest.setWfhEvent(userId, slackResponseEndpoint, startDateTime, endDateTime);
		describe('And the Slack API returns the user\'s real name', () => {
			var employeeName;

			beforeEach(() => {
				employeeName = chance.name();
				fakeSlackApi.getUserInfo.resolves(employeeName);
			});

			describe('And the user already scheduled a wfh event for that time', () => {
				var existingWfhEventId;

				beforeEach(() => {
					existingWfhEventId = chance.string();
					fakeGoogleApi.checkIfWfhEventExists.resolves(existingWfhEventId);
					return act();
				});

				it('should send a response back to Slack telling the user they are already on the calendar', () =>
					sinon.assert.calledWith(fakeSlackApi.sendResponse, slackResponseEndpoint, sinon.match.string)
				);
			});
			describe('And the user didn\'t already submit a /wfh request for that time', () => {
				beforeEach(() => {
					fakeGoogleApi.checkIfWfhEventExists.resolves();
					fakeGoogleApi.createWfhEvent.resolves();
					return act();
				});

				it('should call the Google API to create the WFH event', () =>
					sinon.assert.calledWith(fakeGoogleApi.createWfhEvent, employeeName, startDateTime, endDateTime)
				);

				it('should send a response back to Slack telling the user the WFH event was created', () =>
					sinon.assert.calledWith(fakeSlackApi.sendResponse, slackResponseEndpoint, sinon.match.string)
				);
			});
		});
		describe('And there is an issue connecting with the Slack API', () => {
			beforeEach(() => {
				fakeSlackApi.getUserInfo.rejects();
				return act();
			});

			it('should send a response back to Slack telling the user something went wrong', () =>
				sinon.assert.calledWith(fakeSlackApi.sendResponse, slackResponseEndpoint, sinon.match.string)
			);
		});

		describe('And there is an issue connecting with the Google API', () => {
			beforeEach(() => {
				fakeSlackApi.getUserInfo.resolves(chance.name());
				fakeGoogleApi.checkIfWfhEventExists.rejects();
				return act();
			});

			it('should send a response back to Slack telling the user something went wrong', () =>
				sinon.assert.calledWith(fakeSlackApi.sendResponse, slackResponseEndpoint, sinon.match.string)
			);
		});
	});
	describe('When processing a request to clear,', () => {
			var act = () => handleWfhRequest.clear(userId, slackResponseEndpoint, date);
			describe('And the user already submitted a /wfh request for the requested date', () => {
					var existingWfhEventId, employeeName;
					beforeEach(() => {
						employeeName = chance.name();
						fakeSlackApi.getUserInfo.resolves(employeeName);
						existingWfhEventId = chance.string();
						fakeGoogleApi.checkIfWfhEventExists.resolves(existingWfhEventId);
					});

					describe('And the Google API calender deletion request is issued correctly', () => {
						beforeEach(() => {
							fakeGoogleApi.deleteWfhEvent.resolves();
							return act();
						});

						it('should call the Google API to delete the existing WFH event', () =>
							sinon.assert.calledWith(fakeGoogleApi.deleteWfhEvent, existingWfhEventId)
						);

						it('should send a response back to Slack telling the user a message about how it was deleted', () =>
							sinon.assert.calledWith(fakeSlackApi.sendResponse, slackResponseEndpoint, sinon.match.string)
						);
					});
			});
			describe('And the user has not already submitted a /wfh request for the requested date', () => {
					beforeEach(() => {
						fakeSlackApi.getUserInfo.resolves(chance.name());
						fakeGoogleApi.checkIfWfhEventExists.resolves();
						return act();
					});
					it('should send a response back to Slack telling the user a message that they are not on the wfh calendar', () =>
						sinon.assert.calledWith(fakeSlackApi.sendResponse, slackResponseEndpoint, sinon.match.string)
					);
			});

	});
});