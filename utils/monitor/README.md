<h1 align="center">Custom Monitor</h1>

## How

Run the following to setup the `systemd service`:

```sh
curl https://raw.githubusercontent.com/lambdaclass/zksync_stack/feat_custom_monitor/utils/monitor/setup.sh | bash
```

This will automatically clone the repo at `/home/admin/zksync_stack` and `cp` the `monitor.service` in `/lib/systemd/system/`.

If this is the first time running the script, you will not have the `.env` file, you can run the following:

```sh
cd /home/admin/zksync_stack/utils/monitor
cp .env.example .env
```

Fill the `.env` with the needed values and then:

```sh
sudo systemctl daemon-reload
sudo systemctl restart monitor
```

To print the `console.logs()`:

```sh
journalctl -f -u monitor.service
```


