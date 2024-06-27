<h1 align="center">Custom Monitor</h1>

## How

1. Create and then configure the `.env`:

```sh
cd /home/admin/zksync_stack/utils/monitor
cp .env.example .env
```

Fill the .env file with the required values.

2. Setup systemd Service:

```sh
make setup
```

> [!NOTE]
> If this error is thrown: `Job for monitor.service failed because of unavailable resources or another system error.`
> It may mean that the `.env` file is missing.

2. (extra) To print the `console.logs()`:

```sh
journalctl -f -u monitor.service
```

3. For more targets and options, use:

```sh
make help
```
