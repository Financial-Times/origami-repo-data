
# Origami Repo Data

Get information about Origami repositories. See [the production service][production-url] for API information.

**⚠️ This is a work in progress ⚠️**

[![Build status](https://img.shields.io/circleci/project/Financial-Times/origami-repo-data.svg)][ci]
[![MIT licensed](https://img.shields.io/badge/license-MIT-blue.svg)][license]


## Table Of Contents

  * [Requirements](#requirements)
  * [Running Locally](#running-locally)
  * [Configuration](#configuration)
  * [Operational Documentation](#operational-documentation)
  * [Testing](#testing)
  * [Deployment](#deployment)
  * [Monitoring](#monitoring)
  * [Trouble-Shooting](#trouble-shooting)
  * [License](#license)


## Requirements

Running Origami Repo Data requires [Node.js] 8.x and [npm].


## Running Locally

Before we can run the application, we'll need to install dependencies:

```sh
npm install
```

Run the application in development mode with

```sh
make run-dev
```

Now you can access the app over HTTP on port `8080`: [http://localhost:8080/](http://localhost:8080/)


## Configuration

We configure Origami Repo Data using environment variables. In development, configurations are set in a `.env` file. In production, these are set through Heroku config. Further documentation on the available options can be found in the [Origami Service documentation][service-options].

### Required everywhere

  * `NODE_ENV`: The environment to run the application in. One of `production`, `development` (default), or `test` (for use in automated tests).
  * `PORT`: The port to run the application on.

### Required in Heroku

  * `FASTLY_PURGE_API_KEY`: A Fastly API key which is used to purge URLs (when somebody POSTs to the `/purge` endpoint)
  * `GRAPHITE_API_KEY`: The FT's internal Graphite API key.
  * `PURGE_API_KEY`: The API key to require when somebody POSTs to the `/purge` endpoint. This should be a non-memorable string, for example a UUID
  * `REGION`: The region the application is running in. One of `QA`, `EU`, or `US`
  * `RELEASE_LOG_API_KEY`: The change request API key to use when creating and closing release logs
  * `RELEASE_LOG_ENVIRONMENT`: The Salesforce environment to include in release logs. One of `Test` or `Production`
  * `SENTRY_DSN`: The Sentry URL to send error information to.

### Required locally

  * `GRAFANA_API_KEY`: The API key to use when using Grafana push/pull

### Headers

The service can also be configured by sending HTTP headers, these would normally be set in your CDN config:

  * `FT-Origami-Service-Base-Path`: The base path for the service, this gets prepended to all paths in the HTML and ensures that redirects work when the CDN rewrites URLs.


## Testing

The tests are split into unit tests and integration tests. To run tests on your machine you'll need to install [Node.js] and run `make install`. Then you can run the following commands:

```sh
make test              # run all the tests
make test-unit         # run the unit tests
make test-integration  # run the integration tests
```

You can run the unit tests with coverage reporting, which expects 90% coverage or more:

```sh
make test-unit-coverage verify-coverage
```

The code will also need to pass linting on CI, you can run the linter locally with:

```sh
make verify
```

We run the tests and linter on CI, you can view [results on CircleCI][ci]. `make test` and `make lint` must pass before we merge a pull request.


Deployment
----------

The production ([EU][heroku-production-eu]/[US][heroku-production-us]) and [QA][heroku-qa] applications run on [Heroku]. We deploy continuously to QA via [CircleCI][ci], you should never need to deploy to QA manually. We use a [Heroku pipeline][heroku-pipeline] to promote QA deployments to production.

You can promote either through the Heroku interface, or by running the following command locally:

```sh
make promote
```


Monitoring
----------

  * [Grafana dashboard][grafana]: graph memory, load, and number of requests
  * [Pingdom check (Production EU)][pingdom-eu]: checks that the EU production app is responding
  * [Pingdom check (Production US)][pingdom-us]: checks that the US production app is responding
  * [Sentry dashboard (Production)][sentry-production]: records application errors in the production app
  * [Sentry dashboard (QA)][sentry-qa]: records application errors in the QA app
  * [Splunk (Production)][splunk]: query application logs


Trouble-Shooting
----------------

We've outlined some common issues that can occur in the running of the Origami Repo Data:

### What do I do if memory usage is high?

For now, restart the Heroku dynos:

```sh
heroku restart --app origami-repo-data-eu
heroku restart --app origami-repo-data-us
```

If this doesn't help, then a temporary measure could be to add more dynos to the production applications, or switch the existing ones to higher performance dynos.

### What if I need to deploy manually?

If you _really_ need to deploy manually, you should only do so to QA (production deploys should always be a promotion). Use the following command to deploy to QA manually:

```sh
make deploy
```


License
-------

The Financial Times has published this software under the [MIT license][license].



[ci]: https://circleci.com/gh/Financial-Times/origami-repo-data
[grafana]: http://grafana.ft.com/dashboard/db/origami-repo-data
[heroku-pipeline]: https://dashboard.heroku.com/pipelines/e707ccd0-dd5b-44b2-8361-c13ca892a492
[heroku-production-eu]: https://dashboard.heroku.com/apps/origami-repo-data-eu
[heroku-production-us]: https://dashboard.heroku.com/apps/origami-repo-data-us
[heroku-qa]: https://dashboard.heroku.com/apps/origami-repo-data-qa
[heroku]: https://heroku.com/
[license]: http://opensource.org/licenses/MIT
[node.js]: https://nodejs.org/
[npm]: https://www.npmjs.com/
[pingdom-eu]: https://my.pingdom.com/newchecks/checks#check=3766255
[pingdom-us]: https://my.pingdom.com/newchecks/checks#check=3766267
[production-url]: https://origami-repo-data.ft.com/
[sentry-production]: https://sentry.io/nextftcom/repo-data-production
[sentry-qa]: https://sentry.io/nextftcom/repo-data-qa
[service-options]: https://github.com/Financial-Times/origami-service#options
[splunk]: https://financialtimes.splunkcloud.com/en-US/app/search/search?q=app%3Dorigami-repo-data-*
