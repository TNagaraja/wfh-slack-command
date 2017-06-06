var moment = require('moment-timezone');

function getHours(text, searchStartIndex, searchEndIndex)
{
	var timeArray = (/(\w+:\w\w\s?(AM|am|PM|pm))/).exec(text.substring(searchStartIndex, searchEndIndex));
	var hours = parseInt(timeArray[0].substring(0, timeArray[0].search(':')), 10);
	if ((/(PM|pm)/).test(timeArray[0]))
	{
		if (hours !== 12)
		{
			hours += 12;
		}
	}
	return hours;
}

function getMinutes(text, searchStartIndex, searchEndIndex)
{
	var timeArray = (/(\w+:\w\w\s?(AM|am|PM|pm))/).exec(text.substring(searchStartIndex, searchEndIndex));
	return parseInt(timeArray[0].substr(timeArray[0].search(':') + 1, 2), 10);
}

function checkIfTomorrow(text)
{
	if (text.toLowerCase().includes('tomorrow'))
	{
		return true;
	}
	return false;
}

function extractDateTime(timezone, text, start, end)
{
	var dateTime = moment.tz(timezone).startOf('day');
	if (moment(text, 'MM-DD-YYYY').day())
	{
		dateTime = moment.tz(text, 'MM-DD-YYYY', timezone);
	}
	else if (checkIfTomorrow(text))
	{
		dateTime.add(1, 'day');
	}
	dateTime.hours(getHours(text, start, end)).minutes(getMinutes(text, start, end));
	return dateTime;
}

module.exports = {
	getDate: function (text, timezone) {
		var date = moment.tz(timezone).startOf('Day');
		if (checkIfTomorrow(text))
		{
			date.add(1, 'day');
		}
		else if (moment(text, 'MM-DD-YYYY').day())
		{
			date = moment.tz(text, 'MM-DD-YYYY', timezone);
		}
		return date;
	},
	getStartDateTime: function (text, timezone)
	{
		return extractDateTime(timezone, text, 0, text.search(' to '));
	},
	getEndDateTime: function (text, timezone)
	{
		return extractDateTime(timezone, text, text.search(' to ') + 4, text.length);
	},
	checkIfDateTimeInterval: function (text)
	{
		if (text.includes(' to '))
		{
			return true;
		}
		return false;
	},
	checkIfClear: function (text)
	{
		if (text.toLowerCase().includes('clear'))
		{
			return true;
		}
		return false;
	}
};