var moment = require('moment');

function handleAMPM(text)
{
	var hours = parseInt(text.substring(0, text.search(':')), 10);
	if ((/(AM|am)/).test(text))
	{
		if (hours === 12)
		{
			hours = 0;
		}
	}
	else if ((/(PM|pm)/).test(text))
	{
		if (hours < 12)
		{
			hours += 12;
		}
	}
	return hours;
}

function extractHoursMinutesFromString(text, searchStartIndex, searchEndIndex)
{
	var timeArray = (/(\w+:\w\w\s?(AM|am|PM|pm))/).exec(text.substring(searchStartIndex, searchEndIndex));
	var timeString = `${ handleAMPM(timeArray[0]) }${ timeArray[0].substr(timeArray[0].search(':'), 3) }`;

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
		var date = new Date(moment().startOf('day'));
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