# ZKSYNC_STACK Utils

- `foundry` needed
- `bun` needed
- `direnv` needed

Use `.envrc_example` as template and change it with the desired values.

> [!NOTE] 
> The scripts support flags which overrides the env variables.
> If no flags are used, the env variables are used instead, and if none of them are used, there are some default values only working for local testing
> 
> It is recommended to use the `.envrc` file.

```sh
cp .envrc_example .envrc
direnv allow
```

## Load Tester script

Performs a `deposit` to obtain tokens in the L2, then several transactions are executed to simulate a real scenario.

- flags
  - `--l1_pk`           &rarr; Must have L1 tokens
  - `--l2_pk`           &rarr; Used to perform the back and forth tx testing
  - `--amount_to_pass`  &rarr; Amount to perform the back and forth tx testing
  - `--amount_to_bridge`&rarr; Amount to bridge from the `L1` &rarr; `L2`, the `--l1_pk` is used
  - `--sleep_ms`        &rarr; Interval between the back and forth tx testing

If using the dev config locally, the predefined `env` variables should work
else, set the variables as needed.

Now with the following command you can run any TS cript:

```sh
direnv allow && bun i && bun run scripts/loadTester.ts
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

## Deposit ERC20 script

Performs an ERC20 `deposit`, following the docs:
- [How to deposit ERC20 to zkSync - zkSync Community Code](https://code.zksync.io/tutorials/how-to-deposit-erc20)

- flags
  - `--erc20_l1`        &rarr; L1 ERC20 Address
  - `--erc20_l2`        &rarr; L2 ERC20 Address
  - `--l1_pk`           &rarr; Address that owns some `--erc20_l1` tokens
  - `--amount_to_bridge`&rarr; Amount of `--erc20_l1` to bridge from the `L1` &rarr; `L2`, the `--l1_pk` is used

The `deposit` operation handles the case in which the `ERC20` token used has not been deployed on the `L2`. In such a scenario, the `ERC20` contract will be automatically deployed and will perform the `minting` process to obtain the tokens.

It is recommended to use the `--erc20_l1` flag first, then search for the transaction hash of the operation to obtain the `--erc20_l2` address.

With both addresses, we can also use the `--erc20_l2` flag to print `L2` balances.

To reflect the above comments, replace `0x0` with the actual addresses

```sh
direnv allow
bun run scripts/depositERC20.ts \
--erc20_l1 0x0 \
--amount_to_bridge 1
```

```sh
direnv allow
bun run scripts/depositERC20.ts \
--erc20_l1 0x0 \
--erc20_l2 0x0 \
--amount_to_bridge 1
```
