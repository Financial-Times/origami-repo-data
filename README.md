# Origami Repo Data

Get information about Origami repositories. See [the production service][production-url] for API information.

[![MIT licensed](https://img.shields.io/badge/license-MIT-blue.svg)][license]


## Table Of Contents

- [Origami Repo Data](#origami-repo-data)
  - [Table Of Contents](#table-of-contents)
  - [Requirements](#requirements)
  - [Running Locally](#running-locally)
  - [Configuration](#configuration)
    - [One time only](#one-time-only)
    - [Heroku environment variables](#heroku-environment-variables)
    - [Add secrets locally](#add-secrets-locally)
    - [Headers](#headers)
  - [Database](#database)
  - [Operational Documentation](#operational-documentation)
  - [Testing](#testing)
  - [Deployment](#deployment)
  - [Monitoring](#monitoring)
  - [Trouble-Shooting](#trouble-shooting)
    - [What do I do if memory usage is high?](#what-do-i-do-if-memory-usage-is-high)
    - [What if I need to deploy manually?](#what-if-i-need-to-deploy-manually)
  - [License](#license)


## Requirements

Running Origami Repo Data requires [Node.js] and [npm]. A [PostgreSQL] database is also required.

If you're working on a Mac, the simplest way to install PostgreSQL is to use [Homebrew]. Run the following and pay attention to the instructions output after installing:

```sh
brew install postgresql
```


## Running Locally

Before we can run the application, we'll need to install dependencies:

```sh
npm install
```

Run PostgreSQL locally. If you used brew to install PostgreSQL on a Mac run:

```sh
brew services start postgresql
```

Then create a local PostgreSQL database, you may need to provide credentials for the following command depending on your local setup:

```sh
make db-create
```

Now you'll need to migrate the database, which sets up the required tables. You'll also need to run this command if you pull commits which include new database migrations:

```sh
make db-migrate-up
```

Run the application in development mode with:

```sh
make run-dev
```

Now you can access the app over HTTP on port `8080`: [http://localhost:8080/](http://localhost:8080/)


## Configuration

We configure Origami Repo Data using environment variables. In development, configurations are set in a `.env` file. In production, these are set through Heroku config. Further documentation on the available options can be found in the [Origami Service documentation][service-options].

### One time only

- `ENABLE_SETUP_STEP`: Set to `true` in order to allow the creation of an admin key using the `/v1/setup` endpoint. Once a key has been created this way, this configuration should be removed for security reasons.

### Heroku environment variables

- `CHANGE_API_KEY`: The change-log API key to use when creating and closing change-logs.
- `CMDB_API_KEY`: The CMDB API key to use when updating health checks and the application runbook
- `DATABASE_URL`: A PostgreSQL connection string, with write permission on a database (optional locally)
- `FASTLY_PURGE_API_KEY`: A Fastly API key which is used to purge URLs (when somebody POSTs to the `/purge` endpoint)
- `GITHUB_AUTH_TOKEN`: A GitHub auth token which has read access to all Financial Times repositories.
- `GRAPHITE_API_KEY`: The FT's internal Graphite API key.
- `PURGE_API_KEY`: The API key to require when somebody POSTs to the `/purge` endpoint. This should be a non-memorable string, for example a UUID
- `REGION`: The region the application is running in. One of `QA`, `EU`, or `US`
- `RELEASE_LOG_ENV`: The Salesforce environment to include in change-logs. One of `Test` or `Production`
- `SENTRY_DSN`: The Sentry URL to send error information to.
- `SLACK_ANNOUNCER_AUTH_TOKEN`: The Slack auth token to use when announcing new repo versions on Slack
- `SLACK_ANNOUNCER_CHANNEL_ID`: The Slack channel to announce new repo versions in (unique ID, not channel name)

### Add secrets locally

Origami stores their secrets on Doppler to get them on your local development environment you will need to install the [Doppler CLI](https://docs.doppler.com/docs/enclave-installation), login in Doppler and run the following command to setup Doppler within the repo:
```sh
doppler setup
```

Setup will ask you to select the project you want to use, select `origami-repo-data` and then select the `local` environment. Once setup is complete you can download the secrets to your local environment by running:

```sh
doppler secrets download --format env --no-file > .env
```

**NOTE:** You might need to request contributor access to the Doppler project from the Origami team.

### Headers

The service can also be configured by sending HTTP headers, these would normally be set in your CDN config:

- `FT-Origami-Service-Base-Path`: The base path for the service, this gets prepended to all paths in the HTML and ensures that redirects work when the CDN rewrites URLs.

## Database

Most of the files which are used in maintaining your local database are in the `data` folder of this repo. This is split into migrations and seed data.

You can use the following commands to manage your local database:

```sh
make db-migrate-up    # migrate up to the latest version of the schema
make db-migrate-down  # revert the last applied migration
make db-seed          # add seed data to the database for local testing
```

To create a new migration file, you'll need to run:

```sh
./script/create-migration.js <NAME-OF-MIGRATION>
```

This will generate a file in `data/migration` which you can update to include `up` and `down` migrations. We use [Knex] for migrations, copying from an existing file may help.

Seed data for local development is in `data/seed/demo`. Every file in this directory will be used to seed the database when `make db-seed` is run.


## Operational Documentation

The source documentation for the [runbook] and healthcheck endpoints ([EU][healthcheck-eu]/[US][healthcheck-us]) are stored in the `operational-documentation` folder. These files are pushed to CMDB upon every promotion to production. You can push them to CMDB manually by running the following command:

```sh
make cmdb-update
```


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

To run the integration tests, you'll need a local PostgreSQL database named `origami-repo-data-test`. You can set this up with:

```sh
make db-create-test
```

We run the tests and linter on CI, you can view [results on CI][ci]. `make test` and `make lint` must pass before we merge a pull request.


## Deployment

The production ([EU][heroku-production-eu]/[US][heroku-production-us]) and [QA][heroku-qa] applications run on [Heroku]. We deploy continuously to QA via [CI][ci], you should never need to deploy to QA manually. We use a [Heroku pipeline][heroku-pipeline] to promote QA deployments to production.

You can promote either through the Heroku interface, or by running the following command locally:

```sh
make promote
```


## Monitoring

  * [Grafana dashboard][grafana]: graph memory, load, and number of requests
  * [Pingdom check (Production EU)][pingdom-eu]: checks that the EU production app is responding
  * [Pingdom check (Production US)][pingdom-us]: checks that the US production app is responding
  * [Sentry dashboard (Production)][sentry-production]: records application errors in the production app
  * [Sentry dashboard (QA)][sentry-qa]: records application errors in the QA app
  * [Splunk (Production)][splunk]: query application logs


## Trouble-Shooting

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


## License

The Financial Times has published this software under the [MIT license][license].


[grafana]: http://grafana.ft.com/dashboard/db/origami-repo-data
[healthcheck-eu]: https://endpointmanager.in.ft.com/manage/origami-repo-data-eu.herokuapp.com
[healthcheck-us]: https://endpointmanager.in.ft.com/manage/origami-repo-data-us.herokuapp.com
[heroku-pipeline]: https://dashboard.heroku.com/pipelines/e707ccd0-dd5b-44b2-8361-c13ca892a492
[heroku-production-eu]: https://dashboard.heroku.com/apps/origami-repo-data-eu
[heroku-production-us]: https://dashboard.heroku.com/apps/origami-repo-data-us
[heroku-qa]: https://dashboard.heroku.com/apps/origami-repo-data-qa
[heroku]: https://heroku.com/
[homebrew]: https://brew.sh/
[knex]: http://knexjs.org/
[license]: http://opensource.org/licenses/MIT
[node.js]: https://nodejs.org/
[npm]: https://www.npmjs.com/
[pingdom-eu]: https://my.pingdom.com/newchecks/checks#check=3766255
[pingdom-us]: https://my.pingdom.com/newchecks/checks#check=3766267
[postgresql]: https://www.postgresql.org/
[production-url]: https://origami-repo-data.ft.com/
[runbook]: https://runbooks.in.ft.com/origami-repo-data
[sentry-production]: https://sentry.io/nextftcom/repo-data-production
[sentry-qa]: https://sentry.io/nextftcom/repo-data-qa
[service-options]: https://github.com/Financial-Times/origami-service#options
[splunk]: https://financialtimes.splunkcloud.com/en-US/app/search/search?q=search%20index%3Dheroku%20source%3D%2Fvar%2Flog%2Fapps%2Fheroku%2Forigami-repo-data-*
