# zkSync Stack

## Before running the stack

Before running the stack, you need to create a `.env` file in the root directory of the repository. You can find a template for the `.env` file in the `.env.example` file. You can copy the contents of the `.env.example` file into a new `.env` file and fill in the necessary values.

Also, you need to complete the `shyft.toml` file which will be your L2 configuration file. The fields that you need to fill are related to private keys and addresses. For instance, you should have a minimum of two funded L1 accounts; one for the operator commit, and one for the operator blobs (then you can have a third one corresponding to the fee account, but it could be the same as the operator commit).

## Running the stack

**The following instructions are meant for running the stack without a prover, if you want to run the stuck with a GPU prover skip go to the next section**

To get started, we need to install all the essential dependencies. You can achieve this by running the following command:

```
make deps
```

This command only installs the dependencies required for running the observability tools over the stack (Prometheus, Grafana). In the future, we'll add the installation for the dependencies needed to run this from a fresh new machine.

Once all the dependencies are successfully installed, you need to set up the stack by running the following command:

```
make setup
```

This command will download all the repositories needed to run the stack with a GPU prover in addition to the explorer and the portal.

After the setup is complete, you can start the stack by running the following command:

```
make up
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
make deps
make setup-prover
make up-prover
```

> `setup-prover` does the same as `setup`, but it also downloads the repositories needed to run the stack with a GPU prover, and it generates the universal setup keys.
>
> `up-prover` works the same as `up`, but it also starts the prover components.

## Local Nodes

The mentioned command facilitates the creation of essential Docker containers for your development environment. This includes setting up a `PostgreSQL` database and the L1 local Geth node. Moreover, it compiles and deploys all the necessary contracts for the L2 local node to function. Please note that this process may take a moment to complete.

In this context, it's essential to mention that many of the tools used will take control of the terminal. Therefore, we've installed `tmux` in the previous step to manage different commands and sessions for each tool. For the L2 node, the session is named `s`. To view the logs and observe the server in action, you can use the following command: `tmux a -t s`.

The L1 Geth node runs at `http://localhost:8545`, while the L2 node is available at `http://localhost:3050`.

## Block Explorer

The development environment includes a block explorer to inspect transactions and proofs within the nodes. This explorer runs within a `tmux` session named `e`. You can view it by executing the following command: `tmux a -t e`. To access the explorer in your web browser, navigate to `http://localhost:3010`.

Additionally, you can access the API at `http:localhost/3020` and the worker at `http://localhost:3001`.

## Grafana and Observability

Other Docker containers are running Grafana and Prometheus, tools for monitoring and creating dashboards. To access a helpful dashboard that provides information about every transaction executed by the node, open your web browser and visit `http://localhost:3000`. Once in that page, click on the hamburger menu on the top left of the screen, on the menu that will slide on, head on over to "Dashboards" to see the available dashboards.

## Prover

When the stack is initiated in prover mode, various binaries execute, each containing one of the tools involved in the process of block proof generation. Here's a list of all the binaries and different components being executed, along with their corresponding `tmux` session since all these components take control of the terminal:

- **Prover**: The main prover. The `tmux` session for this part is `p`.
- **Prover gateway**: Acts as a communication layer between the server running the state keeper and the proving subsystem. The `tmux` session for this part is `g`.
- **Witness generators**: Responsible for creating prover jobs. The `tmux` session for this part is `wg`.
- **Witness vector generator**: Responsible for creating prover jobs. The `tmux` session for this part is `wv`.
- **Proof compressor**: The final step that compresses/wraps the FRI proof into a SNARK. The `tmux` session for this part is `c`.
