<h1 align="center">Custom Monitor</h1>

## How

1. Create and then configure the `config.json` file:

```sh
cd zksync_stack/utils/monitor
cp config_example.json config.json
```

Fill the file with the required values.

2. Setup systemd Service:

```sh
make setup
```

- To print the `console.logs()`:

```sh
journalctl -f -u monitor.service
```

- For more targets and options, use:

```sh
make help
```

## Advanced SetUp

If we want to monitor different blockchains, we can create different `services`, the recommended way of monitoring multiple nodes is:

1. You will need a different `config_file`, i.e. `config_prodchain.json`
   1. Fill the file with the required values.
   2. Ideally, the `slack_webhook_url` should be from another Slack's App in order to differentiate between the different monitor services.

2. Create a new `.service` file, i.e. `monitor_prodchain.service`:

```sh
cp monitor.service monitor_prodchain.service
```

2. Change the `Description` of the service:

```
[Unit]
Description=monitor_prodchain
```

3. Change the `ExecStart` of the service to import the required `config_file`, in this example `./config_prodchain.json`:

```
ExecStart=/bin/bash -c '/home/admin/.bun/bin/bun i && /home/admin/.bun/bin/bun run monitor.ts --configFile ./config_prodchain.json'
```

4. Finally, use the `Makefile` to `setup` this new monitor.

```sh
make setup SERVICE=monitor_prodchain
```
