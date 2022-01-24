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

## how to generate local SSL pem files

1. `brew install mkcert`
2. `mkcert -install`
3. `mkcert localhost 127.0.0.1 ::1`
4. copy pem to docker-nginx-cors/cert folder

## how to run local testnet development environment

1. run redis, postgres in docker,`docker run --name postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=ccs -p 5432:5432 -d postgres` and `docker run --name redis -p 6379:6379 -d redis`
2. use `yarn prisma migrate reset` to initiate postgres (if need)
3. prepare `.env` and `.env.testnet` files and cadence files
4. use `yarn start:testnet` to launch server
5. use `yarn prisma studio` to check database in GUI (if need)
6. use `pm2 start "yarn start:testnet" --name nest` run on server

## how to run deploy to docker environment

1. copy .cdc files from cadence folder `rsync -av --progress ../cadence/ cadence/ --exclude .git/ --exclude tests/`
2. change localhost:5432 in .env to postgres:5432
3. change src/config/utils line 25 localhost to redis
4. change DOMAIN=http://localhost:3000 to url in env
5. use `docker-compose up -d`
6. `docker-compose up -d --no-deps --build` if need rebuild
7. restore data (see below)

## how to backup data and restore

1. Backup: At server, run
   `docker exec ccs-postgres /bin/bash -c "PGPASSWORD=PASSWORD pg_dump --username postgres --clean ccs" > ~/backup/$(date +%Y%m%d).sql`
2. Download: `scp ccs:~/backup/$(date +%Y%m%d).sql ./data_backup/` , ccs is server alias
3. Restore: `cat ~/ccs/data_backup/$(date +%Y%m%d).sql | docker exec -i postgres psql -U postgres -d ccs`
