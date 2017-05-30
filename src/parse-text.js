var moment = require('moment');

function adjustHours (text, start, end, hours)
{
	var fixedHours = hours;
	if (text.substring(start, end).includes('PM') || text.substring(start, end).includes('pm'))
	{
		if (hours < 12)
		{
			fixedHours += 12;
		}
	}
	if (text.substring(start, end).includes('AM') || text.substring(start, end).includes('am'))
	{
		if (hours === 12)
		{
			fixedHours = 0;
		}
	}
	return fixedHours;
}

function extractHoursMinutesFromString(text, searchStartIndex, searchEndIndex)
{
	var reachedStartOfTime = false;
	var startOfTimeIndex, timeString, hours;
	for (var i = searchStartIndex; i < searchEndIndex; i += 1)
	{
		if (!reachedStartOfTime && !isNaN(text.charAt(i)))
		{
			reachedStartOfTime = true;
			startOfTimeIndex = i;
		}
		else if (reachedStartOfTime && text.charAt(i) === ':')
		{
			hours = adjustHours(text, searchStartIndex, searchEndIndex, parseInt(text.substring(startOfTimeIndex, i), 10));
			timeString = `${ hours }${ text.substr(i, 3) }`
			break;
		}
	}
	if (timeString.length === 4)
	{
		timeString = `0${ timeString }`;
	}
	return timeString;
}

function checkIfTomorrow(text)
{
	if (text.includes('tomorrow') || text.includes('Tomorrow'))
	{
		return true;
	}
	return false;
}


function extractDateTime(text, start, end)
{
		var hoursStart = start;
		var dateTime = new Date();
		if (moment(text, 'MM-DD-YYYY').day())
		{
			dateTime = new Date(moment(text, 'MM-DD-YYYY').format());
			if (hoursStart === 0)
			{
				hoursStart = text.search(' ');
			}
		}
		else if (checkIfTomorrow(text))
		{
			dateTime.setDate(dateTime.getDate() + 1);
		}
		dateTime = new Date(`${ moment(dateTime).format().substr(0, 11) }${ extractHoursMinutesFromString(text, hoursStart, end) }:00${ moment(dateTime).format().substr(19, 6) }`);

		return dateTime;
}

module.exports = {
	getDate: function (text)
	{
		var date = new Date();
		if (checkIfTomorrow(text))
		{
			date.setDate(date.getDate() + 1);
		}
		else if (moment(text, 'MM-DD-YYYY').day())
		{
			date = new Date(moment(text, 'MM-DD-YYYY').format());
		}
		return date;
	},
	getStartDateTime: function (text)
	{
		return extractDateTime(text, 0, text.search(' to '))
	},
	getEndDateTime: function (text)
	{
		return extractDateTime(text, text.search(' to ') + 4, text.length);
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
		if (text.includes('clear'))
		{
			return true;
		}
		return false;
	}
};