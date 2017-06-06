var chance = require('chance')();
var chai = require('chai');
var rewire = require('rewire');
var sinon = require('sinon');
var moment = require('moment-timezone');

chai.use(require('chai-as-promised'));

var parseText = rewire('../src/parse-text');
describe('Parsing Text', () => {
	var input, date, timezone;
	describe('When processing a request to get the date', () => {
		beforeEach(() => {
			timezone = moment.tz.guess();
		});
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
					date = moment.tz(timezone).add(1, 'day').startOf('day');
					input = `Tomorrow ${ input }`;
					if (endHour !== 12)
					{
						endHour += 12;
					}
					startDateTime = date.clone().tz(timezone).hours(startHour);
					endDateTime = date.clone().tz(timezone).hours(endHour);
				});
				it('should return the start date time', () => {
					sinon.assert.match(parseText.getStartDateTime(input, timezone).isSame(startDateTime, 'minute'), true);
				});
				it('should return the end date time', () => {
					sinon.assert.match(parseText.getEndDateTime(input, timezone).isSame(endDateTime, 'minute'), true);
				});
			});
			describe('And the user enters a date \'MM-DD-YYYY\' before the time interval', () => {
				var dateString;
				beforeEach(() => {
					dateString = chance.date({ string: true });
					date = moment.tz(dateString, 'MM-DD-YYYY', timezone).startOf('day');
					input = `${ dateString } ${ input }`;
					if (endHour !== 12)
					{
						endHour += 12;
					}
					startDateTime = date.clone().hours(startHour);
					endDateTime = date.clone().hours(endHour);
				});
				it('should return the start date time', () => {
					sinon.assert.match(parseText.getStartDateTime(input, timezone).isSame(startDateTime, 'minute'), true);
				});
				it('should return the end date time', () => {
					sinon.assert.match(parseText.getEndDateTime(input, timezone).isSame(endDateTime, 'minute'), true);
				});
			});
			describe('And the user does not enter a date (assume current date))', () => {
				beforeEach(() => {
					date = moment.tz(timezone).startOf('day');
					if (endHour !== 12)
					{
						endHour += 12;
					}
					startDateTime = date.clone().hours(startHour);
					endDateTime = date.clone().hours(endHour);
				});
				it('should return the start date time', () => {
					sinon.assert.match(parseText.getStartDateTime(input, timezone).isSame(startDateTime, 'minute'), true);
				});
				it('should return the end date time', () => {
					sinon.assert.match(parseText.getEndDateTime(input, timezone).isSame(endDateTime, 'minute'), true);
				});

			});

		});
		describe('And the supplied text does not contain a time interval', () => {
			it('should detect that there is no time interval', () => {
				sinon.assert.match(parseText.checkIfDateTimeInterval(chance.sentence()), false);
			});
			var act = () => parseText.getDate(input, timezone);
			describe('And the supplied text contains tomorrow', () =>	{
				beforeEach(() => {
					input = 'tomorrow';
					date = moment.tz(timezone).startOf('day').add(1, 'day');
				});
				it('should return tomorrow\'s date', () => {
					sinon.assert.match(act().isSame(date, 'minute'), true);
				});
			});
			describe('And the supplied text contains a date', () => {
				beforeEach(() => {
					input = chance.date({ string: true });
					date = moment.tz(input, 'MM-DD-YYYY', timezone);
				});
				it('should return the entered date', () => {
					sinon.assert.match(act().isSame(date, 'minute'), true);
				});
			});
			describe('And the supplied text does not contain a date', () => {
				beforeEach(() => {
					input = chance.sentence();
					date = moment.tz(timezone).startOf('day');
				});
				it('should return today\'s date', () => {
					sinon.assert.match(act().isSame(date, 'minute'), true);
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