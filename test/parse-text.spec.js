var chance = require('chance')();
var chai = require('chai');
var rewire = require('rewire');
var sinon = require('sinon');

chai.use(require('chai-as-promised'));

var parseText = rewire('../src/parse-text');
describe('Parsing Text', () => {
	var input, date;
	describe('When processing a request to get the date', () => {
		var act = () => parseText.getDate(input);
		describe('And the supplied text is tomorrow', () =>	{
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