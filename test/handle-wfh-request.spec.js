var Chance = require('chance');
var chai = require('chai');
var rewire = require('rewire');
var sinon = require('sinon');

chai.use(require('chai-as-promised'));

var chance = new Chance();
var handleWfhRequest = rewire('../src/handle-wfh-request');

describe('Handling a WFH request', () => {
	var fakeSlackApi, fakeGoogleApi, slackResponseEndpoint, userId, date;
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
			credentials: sinon.stub().returns(Promise.resolve({})),
			slackApi: fakeSlackApi,
			googleApi: fakeGoogleApi
		});
	};

	beforeEach(() => {
		userId = chance.string();
		slackResponseEndpoint = chance.url();
		date = new Date(chance.date());
		refreshMocks();
	});

	describe('When processing a request', () => {
		var act = () => handleWfhRequest.handleRequest(userId, slackResponseEndpoint, date);
		describe('And the Slack API returns the user\'s real name', () => {
			var employeeName;

			beforeEach(() => {
				employeeName = chance.name();
				fakeSlackApi.getUserInfo.resolves(employeeName);
			});

			describe('And the user already submitted a /wfh request for requested date', () => {
				var existingWfhEventId;

				beforeEach(() => {
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

				describe('And there is an problem issuing the Google API request to delete the event', () => {
					beforeEach(() => {
						fakeGoogleApi.deleteWfhEvent.rejects();
						return act();
					});

					it('should send a response back to Slack telling the user something went wrong', () =>
						sinon.assert.calledWith(fakeSlackApi.sendResponse, slackResponseEndpoint, sinon.match.string)
					);
				});
			})

			describe('And the user didn\'t already submit a /wfh request for requested date', () => {
				beforeEach(() => {
					fakeGoogleApi.checkIfWfhEventExists.resolves();
					fakeGoogleApi.createWfhEvent.resolves();
					return act();
				});

				it('should call the Google API to create the WFH event', () =>
					sinon.assert.calledWith(fakeGoogleApi.createWfhEvent, employeeName, date)
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