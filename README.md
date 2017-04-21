# wfh-slack-command

> Tell your Google Domain calender (and coworkers) if you're working from home today using `/wfh`

## What is this?
This project is a simple web server which listens for `POST` requests for the `/wfh` resource. It is intended to write to a Google Domain calendar resource which all employees can see, thus making it transparent who is WFH that day.

## Get Started

```
$ git clone https://github.com/symphono/wfh-slack-command
$ npm install
```

### What you'll need first

1. Google API service account enabled with domain-wide delegation (`GOOGLE_PRIVATE_KEY` && `GOOGLE_CLIENT_EMAIL`)
1. Google Domain calendar resource (`GOOGLE_TARGET_CALENDAR`)
1. Slack application with API token & configured command (`SLACK_API_KEY`)
1. Replace the values in `.vscode/launch.json` with your API keys and emails
1. Execute the "Launch Program" task through the debug panel in VS Code (easy) _or_ `export` these environmental variables (including `PORT`) and execute `npm start` in your favorite terminal

### Testing
* Run tests with `npm test`
* Use `npm run test-watch` to debug and run tests during development


## License

MIT © [Symphono](https://symphono.com)