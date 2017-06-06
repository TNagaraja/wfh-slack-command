var bodyParser = require('body-parser');
var app = require('express')();
var handleWfhRequest = require('./handle-wfh-request');
var parseText = require('./parse-text');
var slackApi = require('./slack-api');

app.use(bodyParser.urlencoded({ extended: true }));
app.listen(process.env.PORT);

app.post('/wfh', (req, res) => {
	res.send();
	if (parseText.checkIfClear(req.body.text))
	{
		if (parseText.checkIfDateTimeInterval(req.body.text))
		{
			slackApi.getUserTimezone(req.body.user_id).then(tz =>
				handleWfhRequest.clear(req.body.user_id, req.body.response_url, parseText.getStartDateTime(req.body.text, tz), parseText.getEndDateTime(req.body.text, tz))
			);
		}
		else
		{
			slackApi.getUserTimezone(req.body.user_id).then(tz =>
				handleWfhRequest.clear(req.body.user_id, req.body.response_url, parseText.getDate(req.body.text, tz))
			);
		}
	}
	else if (parseText.checkIfDateTimeInterval(req.body.text))
	{
		slackApi.getUserTimezone(req.body.user_id).then(tz =>
			handleWfhRequest.setWfhEvent(req.body.user_id, req.body.response_url, parseText.getStartDateTime(req.body.text, tz), parseText.getEndDateTime(req.body.text, tz))
		);
	}
	else
	{
		slackApi.getUserTimezone(req.body.user_id).then(tz =>
			handleWfhRequest.setWfhEvent(req.body.user_id, req.body.response_url, parseText.getDate(req.body.text, tz))
		);
	}
});