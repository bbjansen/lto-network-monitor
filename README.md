# LTO Node Monitor
> A nifty cron script written in Node.JS that grabs all known peers of the LTO network and tracks data on availbility, ports, geolocation and status.
## Requirements
- Node.Js 8+
- [knex.js]('https://knexjs.org) supported database.
- SQLite 3
- Cron

## .env variables
Create ``.env`` file in the root directory:

```
SEED_NODE=172.104.147.148:6868
DB_FILE=./db.sqlite3
CRON_DISCOVER=* * * * *
CRON_PING=0 0 * * *
CRON_SCAN=0 0 * * *
CRON_LOCATE=0 0 * * 0
```