module.exports = {
	getDate: function (text)
	{
		if (text.includes('tomorrow'))
		{
			var date = new Date();
			date.setDate(date.getDate() + 1);
			return date;
		}
		return new Date();
	},
	checkIfClear: function (text)
	{
		if (text.includes('clear'))
		{
			return true;
		}
		return false;
	},
};