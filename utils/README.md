<h1 align="center">zkSync Stack Utils</h1>

- `bun` needed
- `direnv` needed

## Load Tester script

Use `.envrc_example` as template and change it with the desired values.
If the zksync-era dev config is being used locally, the predefined `env` variables should work, else set the variables as needed.

> [!NOTE] 
> The loadTester accepts flags which overrides the env variables.
> If no flags are used, the env variables are used instead, and if none of them are used, there are some default values only working for local testing
> 
> It is recommended to use the `.envrc` file.

```sh
cp .envrc_example .envrc
direnv allow
```

Performs a `deposit` to obtain tokens in the L2, then several transactions are executed to simulate a real scenario.

- flags
  - `--l1_pk`           &rarr; Must have L1 tokens
  - `--l2_pk`           &rarr; Used to perform the back and forth tx testing
  - `--amount_to_pass`  &rarr; Amount to perform the back and forth tx testing
  - `--amount_to_bridge`&rarr; Amount to bridge from the `L1` &rarr; `L2`, the `--l1_pk` is used
  - `--sleep_ms`        &rarr; Interval between the back and forth tx testing


### How

Allow direnv, install packages and run the script:

```sh
direnv allow && bun i && bun run scripts/loadTester.ts
```

Using the Makefile:

```sh
direnv allow
make utils.test
```

To create a tmux session:

```sh
make utils.test.tmux
```

## Multi Purpose CLI

A multi-purpose CLI is provided that can perform deposits, send balances, and check the balance of any given address. It operates with both the L1 and ZKstack chain.

### How

Install the packages:

```sh
bun i 
```

To use display the help message:
```sh
bun run cli.ts -h
```

This will show available commands. For example, to get help with the `balance` command:
```sh
bun run cli.ts balance -h
```
This command will provide usage instructions and examples.

To create an alias for easier use within the current shell session, ensure you are in the `utils/` directory:
```sh
alias cli="bun run cli.ts"
```
