var Chance = require('chance');
var chai = require('chai');
var rewire = require('rewire');
var sinon = require('sinon');
var Promise = require('bluebird');

chai.use(require('chai-as-promised'));

var chance = new Chance();
var expect = chai.expect;
var slackApiWrapper = rewire('../src/slack-api');
var fakeSlackUser = {};
var fakeResponse = {};

slackApiWrapper.__set__({
	fetch: sinon.stub().resolves(Promise.resolve(fakeResponse))
});

describe('Slack API', () => {
	describe('When getting a user\'s information', () => {
		var userId;
		var act = () => slackApiWrapper.getUserInfo(userId);

		describe('And the user exists', () => {
			beforeEach(() => {
				userId = chance.string();
				fakeSlackUser.user = { real_name: chance.name() };
				fakeResponse.status = 200;
				fakeResponse.json = sinon.stub().resolves(fakeSlackUser);
			});

			it('should return the user\'s real name', () =>
				expect(act()).to.eventually.be.equal(fakeSlackUser.user.real_name)
			);
		});

		describe('And there is an issue connecting to the Slack API', () => {
			beforeEach(() => {
				fakeResponse.status = 500;
			});

			it('should reject with an error', () =>
				expect(act()).to.be.rejected
			);
		});
	});
});