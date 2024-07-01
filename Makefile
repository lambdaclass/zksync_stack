.PHONY: deps down clean prune download-server download-explorer download-portal download-prover setup-all setup-all-no-prover setup-server setup-explorer setup-portal setup-prover run-server run-explorer run-portal run-prover-gateway run-prover-witness-generator run-prover-witness-vector-gen run-prover-prover run-prover-compressor run-prover-all up-no-prover up server explorer portal prover-gateway prover-witness-generator prover-witness-vector-gen prover-prover prover-compressor prover-all

# Homes
ZKSYNC_SERVER_HOME=$(shell pwd)/zksync-era-server
ZKSYNC_PROVER_HOME=$(shell pwd)/zksync-era-prover
ZKSYNC_EXPLORER_HOME=$(shell pwd)/explorer
ZKSYNC_PORTAL_HOME=$(shell pwd)/portal
# Repos
SERVER_REPO=https://github.com/matter-labs/zksync-era.git
PROVER_REPO=https://github.com/matter-labs/zksync-era.git
EXPLORER_REPO=https://github.com/matter-labs/block-explorer.git
PORTAL_REPO=https://github.com/matter-labs/dapp-portal.git
# Commits
SERVER_COMMIT=core-v24.7.0
PROVER_COMMIT=prover-v14.5.0
EXPLORER_COMMIT=main
PORTAL_COMMIT=35b9f7cd21765224f503b9a2a5e3d432c39db6dd
# Private keys
ZKSYNC_DEPLOYER_PRIVATE_KEY=
ZKSYNC_GOVERNANCE_PRIVATE_KEY=
ZKSYNC_GOVERNOR_PRIVATE_KEY=
# Envs
ZKSYNC_ENV=


# General

deps:
	sudo apt update && sudo apt install -y moreutils wget curl tmux jq pkg-config clang cmake
	# yq
	sudo wget https://github.com/mikefarah/yq/releases/latest/download/yq_linux_amd64 -O /usr/bin/yq
	sudo chmod +x /usr/bin/yq
	# Node.js and yarn
	curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
	nvm install 20
	corepack enable
	echo 'Y' | yarn --version
	# Rust
	curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
	curl -L --proto '=https' --tlsv1.2 -sSf https://raw.githubusercontent.com/cargo-bins/cargo-binstall/main/install-from-binstall-release.sh | bash
	cargo-binstall -y sqlx-cli --version 0.7.3

down:
	tmux kill-server || exit 0
	rm -rf /tmp/tmux*

clean:
	ZKSYNC_HOME=${ZKSYNC_SERVER_HOME} zk clean --all
	ZKSYNC_HOME=${ZKSYNC_PROVER_HOME} zk clean --all
	docker rm -f $(shell docker ps -qa) 2>/dev/null || exit 0

prune: down
	rm -rf ${ZKSYNC_SERVER_HOME} ${ZKSYNC_PROVER_HOME} ${ZKSYNC_PORTAL_HOME} ${ZKSYNC_EXPLORER_HOME}
	docker rm -f $(shell docker ps -qa) 2>/dev/null || exit 0

# Download

download-server: deps
	git -C ${ZKSYNC_SERVER_HOME} pull origin ${SERVER_COMMIT}:${SERVER_COMMIT} --ff-only 2>/dev/null || git clone ${SERVER_REPO} ${ZKSYNC_SERVER_HOME}
	git -C ${ZKSYNC_SERVER_HOME} checkout ${SERVER_COMMIT}
	cp diffs/observability.diff ${ZKSYNC_SERVER_HOME}
	cp custom_configs/${ZKSYNC_ENV}.toml ${ZKSYNC_SERVER_HOME}/etc/env/configs/${ZKSYNC_ENV}.toml
	git -C ${ZKSYNC_SERVER_HOME} apply observability.diff || exit 0

download-explorer: deps
	git -C ${ZKSYNC_EXPLORER_HOME} pull origin ${EXPLORER_COMMIT}:${EXPLORER_COMMIT} --ff-only 2>/dev/null || git clone ${EXPLORER_REPO} ${ZKSYNC_EXPLORER_HOME}
	git -C ${ZKSYNC_EXPLORER_HOME} checkout ${EXPLORER_COMMIT}
	cp custom_configs/explorer.json ${ZKSYNC_EXPLORER_HOME}/packages/app/src/configs/hyperchain.config.json
	cp diffs/explorer/explorer.diff ${ZKSYNC_EXPLORER_HOME}
	cp -r diffs/explorer/maintenance ${ZKSYNC_EXPLORER_HOME}
	git -C ${ZKSYNC_EXPLORER_HOME} apply explorer.diff || exit 0	

download-portal: deps
	git -C ${ZKSYNC_PORTAL_HOME} pull origin ${PORTAL_COMMIT}:${PORTAL_COMMIT} --ff-only 2>/dev/null || git clone ${PORTAL_REPO} ${ZKSYNC_PORTAL_HOME}
	git -C ${ZKSYNC_PORTAL_HOME} checkout ${PORTAL_COMMIT}
	cp custom_configs/portal.json ${ZKSYNC_PORTAL_HOME}/hyperchains/config.json
	cp custom_configs/portal.env ${ZKSYNC_PORTAL_HOME}/.env
	cp diffs/portal/portal.diff ${ZKSYNC_PORTAL_HOME}
	cp -r diffs/portal/maintenance ${ZKSYNC_PORTAL_HOME}
	git -C ${ZKSYNC_PORTAL_HOME} apply portal.diff || exit 0

download-prover: deps
	git -C ${ZKSYNC_PROVER_HOME} pull origin ${PROVER_COMMIT}:${PROVER_COMMIT} --ff-only 2>/dev/null || git clone ${PROVER_REPO} ${ZKSYNC_PROVER_HOME}
	git -C ${ZKSYNC_PROVER_HOME} checkout ${PROVER_COMMIT}
	cp custom_configs/${ZKSYNC_ENV}.toml ${ZKSYNC_PROVER_HOME}/etc/env/configs/${ZKSYNC_ENV}.toml

# Setup

setup-all-no-prover: setup-server setup-explorer setup-portal

setup-all: setup-all-no-prover setup-prover

## Server

setup-server: export ZKSYNC_HOME=${ZKSYNC_SERVER_HOME}
setup-server: export DEPLOYER_PRIVATE_KEY=${ZKSYNC_DEPLOYER_PRIVATE_KEY}
setup-server: export GOVERNANCE_PRIVATE_KEY=${ZKSYNC_GOVERNANCE_PRIVATE_KEY}
setup-server: export GOVERNOR_PRIVATE_KEY=${ZKSYNC_GOVERNOR_PRIVATE_KEY}
setup-server: download-server
	sudo chown -R $(USER):$(USER) $(ZKSYNC_SERVER_HOME)
	export PATH=$(ZKSYNC_HOME)/bin:$(PATH) && \
		cd $(ZKSYNC_SERVER_HOME) && \
		./bin/zk && \
		./bin/zk clean --all && \
		./bin/zk env $(ZKSYNC_ENV) && \
		./bin/zk init --run-observability

## Explorer

setup-explorer: export ZKSYNC_HOME=$(ZKSYNC_SERVER_HOME)
setup-explorer: export DATABASE_HOST=127.0.0.1
setup-explorer: export DATABASE_USER=postgres
setup-explorer: export DATABASE_PASSWORD=notsecurepassword
setup-explorer: export DATABASE_URL=postgres://postgres:notsecurepassword@127.0.0.1:5432/block-explorer
setup-explorer: export BLOCKCHAIN_RPC_URL=http://127.0.0.1:3050
setup-explorer: download-explorer
	cd $(ZKSYNC_EXPLORER_HOME) ; npm install
	cd $(ZKSYNC_EXPLORER_HOME)/packages/worker ; npm run db:create || exit 0
	cd $(ZKSYNC_EXPLORER_HOME) ; npm run build

## Portal

setup-portal: download-portal
	echo 'telemetry.enabled=false' > ~/.nuxtrc
	cd $(ZKSYNC_PORTAL_HOME) ; \
		npm install && \
		npm run generate:node:hyperchain

## Prover

setup-prover: FRI_PROVER_SETUP_DATA_PATH=${ZKSYNC_SERVER_HOME}/prover/vk_setup_data_generator_server_fri/data
setup-prover: download-prover
	cp ${ZKSYNC_SERVER_HOME}/etc/env/configs/${ZKSYNC_ENV}.toml ${ZKSYNC_PROVER_HOME}/etc/env/configs/${ZKSYNC_ENV}.toml
	cp -r ${ZKSYNC_SERVER_HOME}/etc/env/configs/${ZKSYNC_ENV}.toml ${ZKSYNC_SERVER_HOME}/etc/env/l2-inits ${ZKSYNC_PROVER_HOME}/etc/env
	sed -i'' -e 's/^proof_sending_mode =.*/proof_sending_mode = "OnlyRealProofs"/' ${ZKSYNC_PROVER_HOME}/etc/env/base/eth_sender.toml
	sed -i'' -e 's;^setup_data_path =.*;setup_data_path = "vk_setup_data_generator_server_fri/data/";' ${ZKSYNC_PROVER_HOME}/etc/env/base/fri_prover.toml
	sed -i'' -e 's;^universal_setup_path =.*;universal_setup_path = "../keys/setup/setup_2^26.kiey";' ${ZKSYNC_PROVER_HOME}/etc/env/base/fri_proof_compressor.toml
	rm -f ${ZKSYNC_PROVER_HOME}/etc/env/target/${ZKSYNC_ENV}.env
	cd ${ZKSYNC_PROVER_HOME}/prover && \
		export ZKSYNC_HOME=${ZKSYNC_PROVER_HOME} && \
		export PATH=${ZKSYNC_PROVER_HOME}/bin:$(PATH) && \
		zk && \
		zk env ${ZKSYNC_ENV} && \
		zk f cargo run --features gpu --release --bin key_generator --generate-sk-gpu all --recompute-if-missing
		cp ${ZKSYNC_PROVER_HOME}/etc/env/target/${ZKSYNC_ENV}.env ${ZKSYNC_SERVER_HOME}/etc/env/target/

# Run

run-server: export ZKSYNC_HOME=$(ZKSYNC_SERVER_HOME)
run-server: $(ZKSYNC_SERVER_HOME)
	export PATH=$(ZKSYNC_HOME)/bin:$(PATH) && \
		cd $(ZKSYNC_SERVER_HOME) && \
		zk server --components=api,eth,tree,state_keeper,housekeeper,commitment_generator,proof_data_handler

run-explorer: export DATABASE_HOST=127.0.0.1
run-explorer: export DATABASE_USER=postgres
run-explorer: export DATABASE_PASSWORD=notsecurepassword
run-explorer: export DATABASE_URL=postgres://postgres:notsecurepassword@127.0.0.1:5432/block-explorer
run-explorer: export BLOCKCHAIN_RPC_URL=http://127.0.0.1:3050
run-explorer: $(ZKSYNC_EXPLORER_HOME)
	cd $(ZKSYNC_EXPLORER_HOME) ; npm run start

run-portal: $(ZKSYNC_PORTAL_HOME)
	cd $(ZKSYNC_PORTAL_HOME) ; npx serve .output/public -p 3002

## Prover

run-prover-gateway: $(ZKSYNC_PROVER_HOME)
	cd $(ZKSYNC_PROVER_HOME) && \
		PATH=$(ZKSYNC_PROVER_HOME)/bin:$(PATH) \
		ZKSYNC_HOME=$(ZKSYNC_PROVER_HOME) \
		zk f cargo run --release --bin zksync_prover_fri_gateway

run-prover-witness-generators: $(ZKSYNC_PROVER_HOME)
	cd $(ZKSYNC_PROVER_HOME) && \
		PATH=$(ZKSYNC_PROVER_HOME)/bin:$(PATH) \
		ZKSYNC_HOME=$(ZKSYNC_PROVER_HOME) \
		API_PROMETHEUS_LISTENER_PORT=3116
		zk f cargo run --release --bin zksync_witness_generator -- --all-rounds

run-prover-witness-vector-gen: $(ZKSYNC_PROVER_HOME)
	cd $(ZKSYNC_PROVER_HOME) && \
		PATH=$(ZKSYNC_PROVER_HOME)/bin:$(PATH) \
		ZKSYNC_HOME=$(ZKSYNC_PROVER_HOME) \
		FRI_WITNESS_VECTOR_GENERATOR_PROMETHEUS_LISTENER_PORT=3420
		zk f cargo run --release --bin zksync_witness_vector_generator -- --all-rounds

run-prover-prover: $(ZKSYNC_PROVER_HOME)
	cd $(ZKSYNC_PROVER_HOME) && \
		PATH=$(ZKSYNC_PROVER_HOME)/bin:$(PATH) \
		ZKSYNC_HOME=$(ZKSYNC_PROVER_HOME) \
		FRI_PROVER_SETUP_DATA_PATH=${ZKSYNC_PROVER_HOME}/prover/vk_setup_data_generator_server_fri/data \
		cargo run --features "gpu" --release --bin zksync_prover_fri

run-prover-compressor: $(ZKSYNC_PROVER_HOME)
	cd $(ZKSYNC_PROVER_HOME) && \
		PATH=$(ZKSYNC_PROVER_HOME)/bin:$(PATH) \
		ZKSYNC_HOME=$(ZKSYNC_PROVER_HOME) \
		zk f cargo run --release --bin zksync_proof_fri_compressor

# Main

up-no-prover: server explorer portal

up: up-no-prover prover-all

server:
	tmux kill-session -t server 2>/dev/null || exit 0
	tmux new -d -s server
	tmux send-keys -t server "make setup-server run-server" Enter

explorer:
	tmux kill-session -t explorer 2>/dev/null || exit 0
	tmux new -d -s explorer
	tmux send-keys -t explorer "make setup-explorer run-explorer" Enter

portal:
	tmux kill-session -t portal 2>/dev/null || exit 0
	tmux new -d -s portal
	tmux send-keys -t portal "make setup-portal run-portal" Enter

## Prover

prover-gateway:
	tmux kill-session -t pg 2>/dev/null || exit 0
	tmux new -d -s pg
	tmux send-keys -t pg "make setup-prover run-prover-gateway" Enter

prover-witness-generator:
	tmux kill-session -t pwg 2>/dev/null || exit 0
	tmux new -d -s pwg
	tmux send-keys -t pwg "make setup-prover run-prover-witness-generator" Enter

prover-witness-vector-gen:
	tmux kill-session -t pwv 2>/dev/null || exit 0
	tmux new -d -s pwv
	tmux send-keys -t pwv "make setup-prover run-prover-witness-vector-gen" Enter

prover-prover:
	tmux kill-session -t pp 2>/dev/null || exit 0
	tmux new -d -s pp
	tmux send-keys -t pp "make setup-prover run-prover-prover" Enter

prover-compressor:
	tmux kill-session -t pc 2>/dev/null || exit 0
	tmux new -d -s pc
	tmux send-keys -t pc "make setup-prover run-prover-compressor" Enter

prover-all: prover-gateway prover-witness-generator prover-witness-vector-gen prover-prover prover-compressor
