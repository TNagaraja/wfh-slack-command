var bodyParser = require('body-parser');
var app = require('express')();
var handleWfhRequest = require('./handle-wfh-request');
var parseText = require('./parse-text')

app.use(bodyParser.urlencoded({ extended: true }));
app.listen(process.env.PORT);

app.post('/wfh', (req, res) => {
	res.send();
	if (parseText.checkIfClear(req.body.text))
	{
		handleWfhRequest.clear(req.body.user_id, req.body.response_url, parseText.getDate(req.body.text));
	}
	else if (parseText.checkIfDateTimeInterval(req.body.text))
	{
			handleWfhRequest.handleRequestInInterval(req.body.user_id, req.body.response_url, parseText.getStartDateTime(req.body.text), parseText.getEndDateTime(req.body.text));
	}
	else
	{
		handleWfhRequest.handleRequest(req.body.user_id, req.body.response_url, parseText.getDate(req.body.text));
	}
});