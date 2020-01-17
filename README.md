# LTO Network Monitor
> A nifty cron script written in Node.JS that grabs all known peers of the LTO network and tracks data on availbility, ports, geolocation and status.
## Requirements
- Node.Js 8+
- [knex.js]('https://knexjs.org) supported database.
- SQLite 3
- Cron

## .env variables
Create ``.env`` file in the root directory:

```
SEED_NODE=<node address>:<api port>
DB_FILE=./db.sqlite3
TIMEOUT=2000
CRON_DISCOVER=*/15 * * * *
CRON_PING=0 0 * * *
CRON_SCAN=0 0 * * *
CRON_LOCATE=0 0 * * 0
```