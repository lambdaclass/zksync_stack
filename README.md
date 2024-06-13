# zkSync Stack

## Before running the stack (configuration)

Before running the stack we need to set up the configuration files. These can be found in the `configs` directory. The configuration files are:

- `network.toml`: This file contains the configuration for the L2 node. It includes the private keys and addresses for the operator, the fee account, and the prover. It also includes the configuration for the L1 node (specifically, the network name), the prover, and the state keeper.
- `explorer.config.json`: This file contains the configuration for the block explorer. It includes the configuration for both the testnet and mainnet networks.
- `portal.config.json`: This file contains the configuration for the portal.

Finally, this is not a configuration file but it is something that we must set up before running the stack. The `Makefile` exports some private keys needed for the stack initialization. These keys are:
- `ZKSYNC_DEPLOYER_PRIVATE_KEY`: The private key of the deployer account.
- `ZKSYNC_GOVERNANCE_PRIVATE_KEY`: The private key of the governance account.
- `ZKSYNC_GOVERNOR_PRIVATE_KEY`: The private key of the governor account.

## Running the stack

You can launch every service of the stack with the Makefile. The basic structure is something as follows, but we give more detailed information below:

![image](https://github.com/lambdaclass/zksync_stack/assets/30054528/2bcd8926-5719-4e46-983d-a6e135e7305b)

**The following instructions are meant for running the stack without a prover, if you want to run the stack with a GPU prover go to the next section**

To get started, we need to setup all the projects we'll be using. This can be done by running the following command:

```
make setup-all-no-prover
```

This command only installs the dependencies required for running the observability tools over the stack (Prometheus, Grafana). In the future, we'll add the installation for the dependencies needed to run this from a fresh new machine.

This command will download all the repositories needed to run the stack without a GPU prover in addition to the explorer and the portal.

Take in account that this step runs a `zk init`, so should be run only once, unless you want to re-init the chain. If you want to setup again the explorer and portal, you have the targets `setup-explorer` and `setup-portal`.

After the setup is complete, you can start the stack by running each of these commands:

```
make run-server
make run-explorer
make run-portal
```

Note that this are blocking commands, so you may need to run it in different sessions.

Additionally, there's a target that do all this things (including setup) for you and put them on separate tmux sessions: 

```
make up-no-prover
```

### Running the stack with a GPU prover

> #### System Requirements
>
> Running a GPU prover requires a CUDA 12.0 installation as a pre-requisite, alongside these machine specs:
>
> - **CPU:** At least 16 physical cores.
> - **RAM:** 85GB of RAM.
> - **Disk:** 200GB of free disk (lower might be fine, depending on how many proofs you want to generate).
>- **GPU:** NVIDIA GPU with CUDA support and at least 6GB of VRAM, we recommend using GPUs with at least 16GB VRAM for optimal performance. In our GPU picks for data centers while running on Google Cloud Platform, the L4 takes the top spot in terms of price-to-performance ratio, with the T4 coming in second.

Running the following commands will set up the stack with a GPU prover:

```
make setup-all
```

> `setup-all-prover` does the same as `setup-all-no-prover`, but it also downloads the repositories needed to run the stack with a GPU prover, and it generates the universal setup keys.

Then you have the following blocking targets to run every component of the prover:

```
make run-prover-gateway
make run-prover-witness-generator
make run-prover-witness-vector-get
make run-prover-prover
make run-prover-compressor
```

Again, if you want to do all in one command (including setup, server, explorer and portal), you have the target:

```
make up
```

## Local Nodes

The mentioned command facilitates the creation of essential Docker containers for your development environment. This includes setting up a `PostgreSQL` database and the L1 local Geth node. Moreover, it compiles and deploys all the necessary contracts for the L2 local node to function. Please note that this process may take a moment to complete.

In this context, it's essential to mention that many of the tools used will take control of the terminal. Therefore, we've installed `tmux` in the previous step to manage different commands and sessions for each tool. For the L2 node, the session is named `server`. To view the logs and observe the server in action, you can use the following command: `tmux a -t server`.

The L1 Geth node runs at `http://localhost:8545`, while the L2 node is available at `http://localhost:3050`.

## Block Explorer

The development environment includes a block explorer to inspect transactions and proofs within the nodes. This explorer runs within a `tmux` session named `explorer`. You can view it by executing the following command: `tmux a -t explorer`. To access the explorer in your web browser, navigate to `http://localhost:3010`.

Additionally, you can access the API at `http:localhost/3020` and the worker at `http://localhost:3001`.

## Portal

The portal serves you to bridge ETH and tokens between L1 and L2. This portal runs within a `tmux` session named `portal`. You can view it by executing the following command: `tmux a -t portal`. To access the portal in your web browser, navigate to `http://localhost:3002`.

## Grafana and Observability

Other Docker containers are running Grafana and Prometheus, tools for monitoring and creating dashboards. To access a helpful dashboard that provides information about every transaction executed by the node, open your web browser and visit `http://localhost:3000`. Once in that page, click on the hamburger menu on the top left of the screen, on the menu that will slide on, head on over to "Dashboards" to see the available dashboards.

## Prover

When the stack is initiated in prover mode, various binaries execute, each containing one of the tools involved in the process of block proof generation. Here's a list of all the binaries and different components being executed, along with their corresponding `tmux` session since all these components take control of the terminal:

- **Prover**: The main prover. The `tmux` session for this part is `pp`.
- **Prover gateway**: Acts as a communication layer between the server running the state keeper and the proving subsystem. The `tmux` session for this part is `pg`.
- **Witness generators**: Responsible for creating prover jobs. The `tmux` session for this part is `pwg`.
- **Witness vector generator**: Responsible for creating prover jobs. The `tmux` session for this part is `pwv`.
- **Proof compressor**: The final step that compresses/wraps the FRI proof into a SNARK. The `tmux` session for this part is `pc`.
