# ccs-server

The server side is responsible for

1. synchronizing event data on the chain
2. performing some complex calculations
3. sending transactions with admin signatures
4. Provide data interface for front-end
5. Manage some business data that does not need to be on the chain

## prepare

1. copy .cdc files from cadence folder `rsync -av --progress ../cadence/ cadence/ --exclude .git/ --exclude tests/`
2. launch postgres `docker run --name postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=ccs -p 5432:5432 -d postgres`
3. create .env like `DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE"` to connect postgres
4. `yarn prisma migrate dev --name initial` to generate prisma client files

## how to test ORM

test ORM with `yarn test:db`

## how to run local emulator environment

1. run **redis**, **postgres** containers in docker
2. run `cd ../dappstarter && yarn dev` as blockchain
3. make sure **localhost**:5432 in .env
4. use `yarn prisma migrate reset` to initiate postgres
5. `yarn start:local` to launch server

## how to run local testnet development environment

1. run redis, postgres in docker
2. use `yarn prisma migrate reset` to initiate postgres (if need)
3. prepare `.env` and `.env.testnet` files
4. use `yarn start:testnet` to launch server
5. use `yarn prisma studio` to check database in GUI (if need)
6. use `pm2 start "yarn start:testnet --name ccs"` run on server

## how to run deploy to docker environment

1. change localhost:5432 in .env to postgres:5432
2. change src/config/utils line 25 localhost to redis
3. use `docker-compose up`

## how to backup data and restore

1. Backup: At server, run
   `docker exec ccs-postgres /bin/bash -c "PGPASSWORD=PASSWORD pg_dump --username postgres --clean ccs" > ~/backup/$(date +%Y%m%d).sql`
2. Download: `scp ccs:~/backup/$(date +%Y%m%d).sql ./data_backup/` , ccs is server alias
3. Restore: `docker exec ccs-postgres /bin/bash -c "PGPASSWORD=PASSWORD psql --username postgres -d ccs" < ./data_backup/$(date +%Y%m%d).sql`
