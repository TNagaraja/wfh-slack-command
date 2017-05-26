var chance = require('chance')();
var chai = require('chai');
var rewire = require('rewire');
var sinon = require('sinon');
var moment = require('moment');

chai.use(require('chai-as-promised'));

var parseText = rewire('../src/parse-text');
describe('Parsing Text', () => {
	var input, date;
	describe('When processing a request to get the date', () => {
		describe('And the supplied text contains a time interval', () => {
			var startDateTime, endDateTime, startHour, endHour;
			beforeEach(() => {
				startHour = chance.hour();
				endHour = chance.hour();
				input = `${ startHour }:00 AM to ${ endHour }:00 PM`;
			});
			it('should detect the time interval', () => {
				sinon.assert.match(parseText.checkIfDateTimeInterval(input), true);
			});
			describe('And the supplied text contains tomorrow', () => {
				beforeEach(() => {
					date = new Date();
					date.setDate(date.getDate() + 1);
					input = `Tomorrow ${ input }`;
					if (startHour < 10)
					{
						startDateTime = new Date(`${ moment(date).format('MMMM') } ${ moment(date).format('D') }, ${ moment(date).format('YYYY') } 0${ startHour }:00:00`);
					}
					else
					{
						startDateTime = new Date(`${ moment(date).format('MMMM') } ${ moment(date).format('D') }, ${ moment(date).format('YYYY') } ${ startHour }:00:00`);
					}
					endDateTime = new Date(`${ moment(date).format('MMMM') } ${ moment(date).format('D') }, ${ moment(date).format('YYYY') } ${ endHour + 12 }:00:00`);
				});
				it('should return the start date time', () => {
					sinon.assert.match(parseText.getStartDateTime(input), startDateTime);
				});
				it('should return the end date time', () => {
					sinon.assert.match(parseText.getEndDateTime(input), endDateTime);
				});
			});
			describe('And the supplied text contains only specified times and no dates (assume today)', () => {
				beforeEach(() => {
					date = new Date();
					if (startHour < 10)
					{
						startDateTime = new Date(`${ moment(date).format('MMMM') } ${ moment(date).format('D') }, ${ moment(date).format('YYYY') } 0${ startHour }:00:00`);
					}
					else
					{
						startDateTime = new Date(`${ moment(date).format('MMMM') } ${ moment(date).format('D') }, ${ moment(date).format('YYYY') } ${ startHour }:00:00`);
					}
					endDateTime = new Date(`${ moment(date).format('MMMM') } ${ moment(date).format('D') }, ${ moment(date).format('YYYY') } ${ endHour + 12 }:00:00`);
				});
				it('should return the start date time', () => {
					sinon.assert.match(parseText.getStartDateTime(input), startDateTime);
				});
				it('should return the end date time', () => {
					sinon.assert.match(parseText.getEndDateTime(input), endDateTime);
				});

			});

		});
		describe('And the supplied text does not contain a time interval', () => {
			it('should detect that there is no time interval', () => {
				sinon.assert.match(parseText.checkIfDateTimeInterval(chance.sentence()), false);
			});
			var act = () => parseText.getDate(input);
			describe('And the supplied text contains tomorrow', () =>	{
				beforeEach(() => {
					input = 'tomorrow';
					date = new Date();
					date.setDate(date.getDate() + 1);
				});
				it('should return tomorrow\'s date', () => {
					sinon.assert.match(act().getDate(), date.getDate());
				});
			});
			describe('And the supplied text is something else', () => {
				beforeEach(() => {
					input = chance.sentence();
					date = new Date();
					return act();
				});
				it('should return today\'s date', () => {
					sinon.assert.match(act().getDate(), date.getDate());
				});
			});
		});
	});
	describe('When processing a request to checkIfClear', () => {
		var act = () => parseText.checkIfClear(input);
		describe('And the text is \'clear\'', () => {
			beforeEach(() => {
				input = 'clear';
			});
			it('should return true', () => {
				sinon.assert.match(act(), true);
			});
		});
		describe('And the text is some random other text', () => {
			beforeEach(() => {
				input = chance.sentence();
			});
			it('should return false', () => {
				sinon.assert.match(act(), false);
			});
		});
	});
});