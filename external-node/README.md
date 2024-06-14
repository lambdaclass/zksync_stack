<h1 align="center">External Node</h1>

<div align="center">

[What?](#what) - [Why?](#why) - [How?](#how)

</div>

- [Snapshots as User - Run the external node](#snapshots-as-user---run-the-external-node)
- [Snapshots as Dev - Set the GCS bucket](#snapshots-as-dev---set-the-gcs-bucket)
- [Postgres Dump as User - Run the external node](#postgres-dump-as-user---run-the-external-node)
- [Postgres Dump as Dev - Create the `.dump`](#postgres-dump-as-dev---create-the-dump)
- [Useful Resources](#useful-resources)

# What?

An External Node (`EN` for short) acts as an intermediary between the user and the `Main Node` (`MN`). The transactions received by the `EN` are then passed to the `MN`.

# Why?

If the `EN` endpoint is used to query information, no information has to be sent to the `MN`, so it "balances" the load. It also can be used to provide multiple endpoints in different locations with better latency.

> [!NOTE]
> Following `zksync-era's` docs
> [zksync-era/docs/guides/external-node/00_quick_start.md at main · matter-labs/zksync-era](https://github.com/matter-labs/zksync-era/blob/main/docs/guides/external-node/00_quick_start.md)

# How?

There are two ways to start an `EN`:
- `snapshots` 
- `postgres_dump`.

> [!WARNING]
>  If you are `restarting` an external node, clean up the volumes to avoid weird states:

```sh
docker-compose --file en-docker-compose.yml down --volumes
```

## Snapshots as User - Run the external node

1. Create and configure the `en-docker-compose.yml` as needed:

```sh
cp en-docker-compose.yml.example en-docker-compose.yml
```

2. Fill up the variable the `en-docker-compose.yml` makes use of:

This URL should be provided by the Main Node's Administrator

```yaml
# Just write down the <THIS STRING> specified in the URL: https://console.cloud.google.com/storage/browser/<THIS STRING>
EN_SNAPSHOTS_OBJECT_STORE_BUCKET_BASE_URL: "<THIS STRING>"
```

3. Start the external node:

```sh
docker-compose --file en-docker-compose.yml up -d
```

## Snapshots as Dev - Set the GCS bucket

1. You will need a `GCS` account.
2. Create a `bucket`.
3. Create a `service account` for that bucket.
4. Get the `.json` key.
   1. APIs & Services &rarr; Credentials &rarr; Service Accounts (click the one you've just set).
   2. Click the `KEYS` button on top.
   3. Click `ADD KEY` &rarr; Create new key &rarr; JSON.
5. Rename the downloaded key to `key.json` and place it inside `zksync_stack/external-node` (it's private, be catious).


6. Create and configure the `snapshots-docker-compose.yml` as needed:

```sh
cp snapshots-docker-compose.yml.example snapshots-docker-compose.yml
```

7. Fill up the variable the `snapshots-docker-compose.yml` makes use of:

Complete with the link of your `bucket`.

```yaml
SNAPSHOTS_OBJECT_STORE_BUCKET_BASE_URL: # Just write down the <THIS STRING> specified in the URL: https://console.cloud.google.com/storage/browser/<THIS STRING>
```

The `restarter` service will execute the "snapshot creation" every 12[hs].

8. Start the `snapshot_creator`:

```sh
docker-compose --file snapshots-docker-compose.yml up -d
```

## Postgres Dump as User - Run the external node

1. Obtain the `postgres dump` from the `MN` and place it inside `pg_backups/backup.dump`. (This file should be provided by the Main Node's Administrator)

For example:
```sh
cp backup.dump pg_backups/
```

2. Create and configure the `en-docker-compose.yml` as needed:

```sh
cp en-docker-compose.yml.example en-docker-compose.yml
```

3. Fill up the variable the `en-docker-compose.yml` makes use of:

```yaml
volumes:
    - testnet-postgres:/var/lib/postgresql/data
    - ./pg_backups:/pg_backups
    # Uncomment this line if using postgres' dumps
    - ./restore_dump.sh:/docker-entrypoint-initdb.d/restore_dump.sh

# Set to false if using postgres' dumps
EN_SNAPSHOTS_RECOVERY_ENABLED: "false"
```

4. Start the external node:

```sh
docker-compose --file en-docker-compose.yml up -d
```


## Postgres Dump as Dev - Create the `.dump`

1. Obtain the `postgres dump` from the `MN`.

The folloiwng command works if you are connected to the `MN` via ssh:
(Change the user as needed)
```sh
pg_dump -Fc -U postgres -p 5432 -h localhost postgres > backup.dump
```

2. Copy the `postgres dump` into the `EN` and place it inside the `pg_backups` folder:

(Access to the `MN` from the `EN` is required)
```sh
rsync -azP <user>@<main_node>:~/backup.dump pg_backups/
```

3. Create and configure the `en-docker-compose.yml` as needed:

```sh
cp en-docker-compose.yml.example en-docker-compose.yml
```

4. Fill up the variable the `en-docker-compose.yml` makes use of:

```yaml
volumes:
    - testnet-postgres:/var/lib/postgresql/data
    - ./pg_backups:/pg_backups
    # Uncomment this line if using postgres' dumps
    - ./restore_dump.sh:/docker-entrypoint-initdb.d/restore_dump.sh

# Set to false if using postgres' dumps
EN_SNAPSHOTS_RECOVERY_ENABLED: "false"
```

5. Start the external node:

```sh
docker-compose --file en-docker-compose.yml up -d
```

# Ports

<div align="center">

| Host Port | Docker Port |    Description    |
| :-------: | :---------: | :---------------: |
|   3150    |    3050     |     HTTP RPC      |
|   3151    |    3051     |      WS RPC       |
|   3181    |    3081     |    HEALTHCHECK    |
|   3322    |    3322     | PROMETHEUS SCRAPE |
|   5430    |    5430     |     POSTGRES      |
|   9190    |    9090     | PROMETHEUS FRONT  |
|   3100    |    3100     |      GRAFANA      |

</div>

## Useful Resources

- Snapshots:
    - [Testing docs](https://github.com/matter-labs/zksync-era/blob/main/core/bin/snapshots_creator/README.md)
    - [Dockerfile](https://github.com/matter-labs/zksync-era/blob/main/docker/snapshots-creator/Dockerfile)
- [matter-labs/ansible-en-role: Ansible role for zkSync Era External Node](https://github.com/matter-labs/ansible-en-role)
