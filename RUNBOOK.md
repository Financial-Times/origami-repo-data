# Origami Repo Data

Origami Repo Data is an API which can be used to get information about repositories which contain an origami.json file. These could be components, services, image sets, and Node.js modules.

## Service Tier

Silver

## Lifecycle Stage

Production

## Primary URL

https://origami-repo-data.ft.com

## Replaces

* origami-registry

## Host Platform

Heroku

## Contains Personal Data

no

## Contains Sensitive Data

no

## Delivered By

origami-team

## Supported By

origami-team

## Known About By

* lee.moody
* jake.champion
* rowan.manning

## Dependencies

* github
* heroku
* slack-financialtimes

## Healthchecks

* origami-repo-data-us.herokuapp.com-https
* origami-repo-data-eu.herokuapp.com-https

## Failover Architecture Type

ActiveActive

## Failover Process Type

FullyAutomated

## Failback Process Type

FullyAutomated

## Data Recovery Process Type

PartiallyAutomated

## Release Process Type

PartiallyAutomated

## Rollback Process Type

PartiallyAutomated

## Key Management Process Type

Manual

## Architecture Diagram

<p><a href="https://docs.google.com/a/ft.com/drawings/d/1qKROLQvR-D5LzxxTTkJgzcr5IlLLkaRh3bEtF0AAYeA/edit?usp=sharing">Google Drawing</a></p>

## Architecture

This is an application with several moving parts, mostly centred around a Node.js application but with the following external components:

  - A PostgreSQL [database hosted by Heroku](https://dashboard.heroku.com/apps/origami-repo-data-eu/resources) on the EU application
  - An [organisation-wide Webhook](https://github.com/organizations/Financial-Times/settings/hooks) on the Financial-Times GitHub
  - A Slack integration, for posting in the #ft-origami Slack channel

### Fetching repo data

When a user fetches repo data via the API, the process for getting that data is relatively simple. The Node.js application queries the PostgreSQL database directly, and returns some formatted results.

### Adding repositories

When a repository is changed on GitHub, the org-wide webhook adds an item to a queue within the Node.js application (backed by PostgreSQL). The Node.js application checks this queue periodically, ingesting data via the GitHub API if the repository is a valid Origami repository. Once the repository is ingested, a Slack message is sent to the #ft-origami channel.

## First Line Troubleshooting

This application is not critical outside of office hours, please contact the Origami team and we'll fix when we're in the office.

If no member of the Origami team is available, this is still required to be running by a lot of engineers at the Financial Times. There are a few things you can try:

1. Restart all of the dynos across the production EU and US Heroku apps ([pipeline here](https://dashboard.heroku.com/pipelines/e707ccd0-dd5b-44b2-8361-c13ca892a492))
2. Check that the database is running ([click "Heroku Postgres" here](https://dashboard.heroku.com/apps/origami-repo-data-eu/resources))


## Second Line Troubleshooting

If the application is failing entirely, you'll need to check a couple of things:

1. Did a deployment just happen? If so, roll it back to bring the service back up (hopefully)
2. Check the Heroku metrics page for both EU and US apps, to see what CPU and memory usage is like ([pipeline here](https://dashboard.heroku.com/pipelines/e707ccd0-dd5b-44b2-8361-c13ca892a492))
2. Check the Splunk logs (see the monitoring section of this runbook for the link)

If only a few things aren't working, the Splunk logs (see monitoring) are the best place to start debugging. Always roll back a deploy if one happened just before the thing stopped working – this gives you the chance to debug in the relative calm of QA.

## Monitoring

- [Pingdom (EU)](https://my.pingdom.com/newchecks/checks#check=3766255)
- [Pingdom (US)](https://my.pingdom.com/newchecks/checks#check=3766267)
- [Grafana Dashboard](http://grafana.ft.com/dashboard/db/origami-repo-data)
- [Splunk](https://financialtimes.splunkcloud.com/en-US/app/search/search?q=search%20index%3Dheroku%20source%3D%2Fvar%2Flog%2Fapps%2Fheroku%2Forigami-repo-data-*)

## Failover Details

Our Fastly config automatically routes requests between the production EU and US Heroku applications. If one of those regions is down, Fastly will route all requests to the other region.

## Data Recovery Details

The database is backed up automatically by Heroku, but restoring the data is a manual process:

1. Go to the [resources page for the EU Heroku application](https://dashboard.heroku.com/apps/origami-repo-data-eu/resources)
2. Click the "Heroku Postgres" resource
3. In the new window that opens, click the "Duriability" tab
4. Click the "Rollback Database" button
5. Enter a date and time to roll back to


## Release Details

The application is deployed to QA whenever a new commit is pushed to the `master` branch of this repo on GitHub. To release to production, the QA application must be [manually promoted through the Heroku interface](https://dashboard.heroku.com/pipelines/e707ccd0-dd5b-44b2-8361-c13ca892a492).

## Key Management Details

The keys are managed [via the API here](https://origami-repo-data.ft.com/v1/docs/api/keys). As the system doesn't deal with any sensitive data, keys are only really used by us to track usage of the system by other systems.
