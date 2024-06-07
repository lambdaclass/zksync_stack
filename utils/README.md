# ZKSYNC_STACK Utils

- `foundry` needed
- `bun` needed
- `direnv` needed

## Load Tester

1. Use `.envrc_example` as template:

Modify `.envrc` with the needed variables

> [!NOTE] The script supports flags which overrides the env variables.
> If no flags are used, the env variables are used instead, and if none of them are used,there are some default values only working for local testing
> 
> It is recommended to use the `.envrc` file.

- flags
  - `--l1_pk`           &rarr; Must have L1 tokens
  - `--l2_pk`           &rarr; Used to perform the back and forth tx testing
  - `--amount_to_pass`  &rarr; Amount to perform the back and forth tx testing
  - `--amount_to_bridge`&rarr; Amount to bridge from the `L1` &rarr; `L2`, the `--l1_pk` is used
  - `--sleep_ms`        &rarr; Interval between the back and forth tx testing

If using the dev config locally, the predefined `env` variables should work
else, set the variables as needed.

```sh
cp .envrc_example .envrc
direnv allow
```

1. Now with the following command you can run any TS cript:

```sh
bun i && bun run scripts/loadTester.ts
```

Usign the Makefile:

```sh
direnv allow
make utils.test
```

To create a tmux session:

```sh
make utils.test.tmux
```

If you want to use docker:

```sh
docker compose --file compose.loadtester.yml up
```
