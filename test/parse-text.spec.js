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
		describe('And the supplied text contains a time interval \'HH:MM am/pm to HH:MM am/pm\'', () => {
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
					if (endHour === 12)
					{
						endDateTime = new Date(`${ moment(date).format('MMMM') } ${ moment(date).format('D') }, ${ moment(date).format('YYYY') } ${ endHour }:00:00`);
					}
					else
					{
						endDateTime = new Date(`${ moment(date).format('MMMM') } ${ moment(date).format('D') }, ${ moment(date).format('YYYY') } ${ endHour + 12 }:00:00`);
					}
				});
				it('should return the start date time', () => {
					sinon.assert.match(parseText.getStartDateTime(input), startDateTime);
				});
				it('should return the end date time', () => {
					sinon.assert.match(parseText.getEndDateTime(input), endDateTime);
				});
			});
			describe('And the user enters a date \'MM-DD-YYYY\' before the time interval', () => {
				var dateString;
				beforeEach(() => {
					dateString = chance.date({ string: true });
					date = new Date(moment(dateString, 'MM-DD-YYYY').format());
					input = `${ dateString } ${ input }`;
					if (startHour < 10)
					{
						startDateTime = new Date(`${ moment(date).format('MMMM') } ${ moment(date).format('D') }, ${ moment(date).format('YYYY') } 0${ startHour }:00:00`);
					}
					else
					{
						startDateTime = new Date(`${ moment(date).format('MMMM') } ${ moment(date).format('D') }, ${ moment(date).format('YYYY') } ${ startHour }:00:00`);
					}
					if (endHour === 12)
					{
						endDateTime = new Date(`${ moment(date).format('MMMM') } ${ moment(date).format('D') }, ${ moment(date).format('YYYY') } ${ endHour }:00:00`);
					}
					else
					{
						endDateTime = new Date(`${ moment(date).format('MMMM') } ${ moment(date).format('D') }, ${ moment(date).format('YYYY') } ${ endHour + 12 }:00:00`);
					}
				});
				it('should return the start date time', () => {
					sinon.assert.match(parseText.getStartDateTime(input), startDateTime);
				});
				it('should return the end date time', () => {
					sinon.assert.match(parseText.getEndDateTime(input), endDateTime);
				});
		});
			describe('And the user does not enter a date (assume current date))', () => {
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
					if (endHour === 12)
					{
						endDateTime = new Date(`${ moment(date).format('MMMM') } ${ moment(date).format('D') }, ${ moment(date).format('YYYY') } ${ endHour }:00:00`);
					}
					else
					{
						endDateTime = new Date(`${ moment(date).format('MMMM') } ${ moment(date).format('D') }, ${ moment(date).format('YYYY') } ${ endHour + 12 }:00:00`);
					}
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
			describe('And the supplied text contains a date', () => {
				beforeEach(() => {
					input = chance.date({ string: true });
					date = new Date(moment(input, 'MM-DD-YYYY').format());
				});
				it('should return the entered date', () => {
					sinon.assert.match(act().getDate(), date.getDate());
				});
			});
			describe('And the supplied text does not contain a date', () => {
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