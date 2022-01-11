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
3. create .env like `DATABASE_URL="postgres://USER:PASSWORD@HOST:PORT/DATABASE"` to connect postgres
4. `yarn prisma migrate dev --name initial` to generate prisma client files

## how to test ORM

test ORM with `yarn test:db`

## how to run local emulator environment

1. run **redis**, **postgres**, **flow-dev-wallet**containers in docker2
2. run local wallet by `sh runLocalWallet.sh`
3. run `cd ../dappstarter && yarn dev` as blockchain
4. make sure **localhost**:5432 in .env and localhost of redis setting in `src/config/utils.ts`
5. use `yarn prisma migrate reset` to initiate postgres
6. `yarn start:local` to launch server

## how to run local testnet development environment

1. run redis, postgres in docker,`docker run --name postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=ccs -p 5432:5432 -d postgres` and `docker run --name redis -p 6379:6379 -d redis`
2. use `yarn prisma migrate reset` to initiate postgres (if need)
3. prepare `.env` and `.env.testnet` files, scp `dapp-config.json` to src/config
4. use `yarn start:testnet` to launch server
5. use `yarn prisma studio` to check database in GUI (if need)
6. use `pm2 start "yarn start:testnet" --name nest` run on server

## how to run deploy to docker environment

1. change localhost:5432 in .env to postgres:5432
2. change src/config/utils line 25 localhost to redis
3. use `docker-compose up -d`
4. `docker-compose up -d --no-deps --build` if need rebuild

## how to backup data and restore

1. Backup: At server, run
   `docker exec ccs-postgres /bin/bash -c "PGPASSWORD=PASSWORD pg_dump --username postgres --clean ccs" > ~/backup/$(date +%Y%m%d).sql`
2. Download: `scp ccs:~/backup/$(date +%Y%m%d).sql ./data_backup/` , ccs is server alias
3. Restore: `cat ~/ccs/data_backup/$(date +%Y%m%d).sql | docker exec -i postgres psql -U postgres -d ccs`
