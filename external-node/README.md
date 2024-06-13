<h1 align="center">External Node</h1>

<div align="center">

[What?](#what) - [Why?](#why) - [How?](#how)

[Resources](#useful-resources)

</div>

## What?
An External Node (`EN` for short) acts as an intermediary between the user and the `Main Node` (`MN`). The transactions received by the `EN` are then passed to the `MN`.

## Why?
If the `EN` endpoint is used to query information, no information has to be sent to the `MN`, so it "balances" the load. It also can be used to provide multiple endpoints in different locations with better latency.

> [!NOTE]
> Following `zksync-era's` docs
> [zksync-era/docs/guides/external-node/00_quick_start.md at main · matter-labs/zksync-era](https://github.com/matter-labs/zksync-era/blob/main/docs/guides/external-node/00_quick_start.md)

## How?

There are two ways to start an `EN`:
- `snapshots` 
- `postgres_dump`.

> [!IMPORTANT]
> At the moment, dumps are being used. 
> A way to set up snapshots and store them is needed.

1. Obtain the `postgres dump` from the `MN`.

The folloiwng command works if you are connected to the `MN` via ssh:
(Change the user as needed)
```sh
pg_dump -Fc -U postgres -p 5432 -h localhost postgres > backup.dump
```

2. Copy the `postgres dump` into the `EN` and place it inside the `pg_backups` folder.

(Access to the `MN` from the `EN` is required)
```sh
rsync -azP <user>@<main_node>:~/backup.dump pg_backups/
```

1. Create and configure the `en-docker-compose.yml` as needed:

```sh
cp en-docker-compose.yml.example en-docker-compose.yml
```

4. Finally, start the external node.

```sh
docker-compose --file en-docker-compose.yml up
```

### Ports

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
