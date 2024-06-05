.PHONY: setup download setup-keys run-gpu server prover-gateway witness-generators witness-vector-generator prover compressor explorer portal

# Homes
export ZKSYNC_CORE_HOME=$(shell pwd)/zksync-era-core
export ZKSYNC_PROVER_HOME=$(shell pwd)/zksync-era-prover
export ZKSYNC_EXPLORER_HOME=$(shell pwd)/explorer
export ZKSYNC_PORTAL_HOME=$(shell pwd)/portal
# Commits
export CORE_COMMIT=core-v24.7.0
export PROVER_COMMIT=prover-v14.5.0
export ZKSYNC_PORTAL_COMMIT=8471411eebcae55dba940bee492ba6cb74a167d3
# Private keys
export DEPLOYER_PRIVATE_KEY=
export GOVERNANCE_PRIVATE_KEY=
export GOVERNOR_PRIVATE_KEY=
# Envs
export ZKSYNC_ENV=shyft
# Explorer
export DATABASE_HOST=127.0.0.1
export BLOCKCHAIN_RPC_URL=http://127.0.0.1:3050
export DATABASE_URL=postgres://postgres:notsecurepassword@127.0.0.1:5432/block-explorer
export DATABASE_USER=postgres
export DATABASE_PASSWORD=notsecurepassword

# Main

setup: deps | download init

setup-prover: | setup keys

up: explorer portal server

up-prover: explorer portal | server prover-gateway witness-generators witness-vector-generator prover compressor

down:
	tmux kill-server
	rm -rf /tmp/tmux*

clean:
	export ZKSYNC_HOME=${ZKSYNC_CORE_HOME} && ${ZKSYNC_CORE_HOME}/bin/zk clean --all
	docker rm -f $(docker ps -qa) || exit 0

prune:
	rm -rf ${ZKSYNC_CORE_HOME} ${ZKSYNC_EXPLORER_HOME} ${ZKSYNC_PORTAL_HOME} ${ZKSYNC_PROVER_HOME}
	docker rm -f $(docker ps -qa) || exit 0

deps:
	sudo apt install -y snapd
	sudo snap install yq
	export PATH=/snap/bin:$(PATH)
	sudo apt install -y moreutils

# Components

server:
	tmux kill-session -t s; \
	tmux new -d -s s; \
	tmux send-keys -t s "cd ${ZKSYNC_CORE_HOME} && export ZKSYNC_HOME=${ZKSYNC_CORE_HOME}" Enter; \
	tmux send-keys -t s "./bin/zk server --components=api,eth,tree,state_keeper,housekeeper,commitment_generator,proof_data_handler" Enter;

prover-gateway:
	tmux kill-session -t g; \
	tmux new -d -s g; \
	tmux send-keys -t g "cd ${ZKSYNC_PROVER_HOME}/prover && export ZKSYNC_HOME=${ZKSYNC_PROVER_HOME}" Enter; \
	tmux send-keys -t g "../bin/zk f cargo run --release --bin zksync_prover_fri_gateway" Enter;

witness-generators:
	tmux kill-session -t wg; \
	tmux new -d -s wg; \
	tmux send-keys -t wg "cd ${ZKSYNC_PROVER_HOME}/prover && export ZKSYNC_HOME=${ZKSYNC_PROVER_HOME}" Enter; \
	tmux send-keys -t wg "API_PROMETHEUS_LISTENER_PORT=3116 ../bin/zk f cargo run --release --bin zksync_witness_generator -- --all_rounds" Enter;

witness-vector-generator:
	tmux kill-session -t wv; \
	tmux new -d -s wv; \
	tmux send-keys -t wv "cd ${ZKSYNC_PROVER_HOME}/prover && export ZKSYNC_HOME=${ZKSYNC_PROVER_HOME}" Enter; \
	tmux send-keys -t wv "FRI_WITNESS_VECTOR_GENERATOR_PROMETHEUS_LISTENER_PORT=3420 ../bin/zk f cargo run --release --bin zksync_witness_vector_generator" Enter;

prover:
	tmux kill-session -t p; \
	tmux new -d -s p; \
	tmux send-keys -t p "cd ${ZKSYNC_PROVER_HOME}/prover && export ZKSYNC_HOME=${ZKSYNC_PROVER_HOME}" Enter; \
	tmux send-keys -t p "../bin/zk f env FRI_PROVER_SETUP_DATA_PATH=${ZKSYNC_PROVER_HOME}/prover/vk_setup_data_generator_server_fri/data cargo run --features "gpu" --release --bin zksync_prover_fri" Enter;

compressor:
	tmux kill-session -t c; \
	tmux new -d -s c; \
	tmux send-keys -t c "cd ${ZKSYNC_PROVER_HOME}/prover && export ZKSYNC_HOME=${ZKSYNC_PROVER_HOME}" Enter; \
	tmux send-keys -t c "../bin/zk f cargo run --release --bin zksync_proof_fri_compressor" Enter;

explorer:
	tmux kill-session -t e; \
	tmux new -d -s e; \
	tmux send-keys -t e "cd ${ZKSYNC_PROVER_HOME}/prover && export ZKSYNC_HOME=${ZKSYNC_PROVER_HOME}" Enter; \
	tmux send-keys -t e "cd ${ZKSYNC_EXPLORER_HOME}" Enter; \
	tmux send-keys -t e "npm run start" Enter;

portal:
	tmux kill-session -t po; \
	tmux new -d -s po; \
	tmux send-keys -t po "cd ${ZKSYNC_PORTAL_HOME}" Enter; \
	tmux send-keys -t po "echo y | npx serve .output/public/ -p 3002" Enter;

# Setup

download-portal:
	git clone https://github.com/matter-labs/dapp-portal.git ${ZKSYNC_PORTAL_HOME} || exit 0
	cp diffs/portal.diff ${ZKSYNC_PORTAL_HOME}
	git -C ${ZKSYNC_PORTAL_HOME} apply portal.diff || exit 0

download-explorer:
	git clone https://github.com/matter-labs/block-explorer.git ${ZKSYNC_EXPLORER_HOME} || exit 0
	cp diffs/explorer.diff ${ZKSYNC_EXPLORER_HOME}
	git -C ${ZKSYNC_EXPLORER_HOME} apply explorer.diff || exit 0

download-core:
	git -C ${ZKSYNC_CORE_HOME} checkout ${CORE_COMMIT} && git -C ${ZKSYNC_CORE_HOME} pull origin ${CORE_COMMIT} --ff-only || git clone https://github.com/matter-labs/zksync-era.git ${ZKSYNC_CORE_HOME} -b ${CORE_COMMIT}
	cp diffs/observability.diff ${ZKSYNC_CORE_HOME}
	git -C ${ZKSYNC_CORE_HOME} apply observability.diff || exit 0
	cp ${ZKSYNC_ENV}.toml ${ZKSYNC_CORE_HOME}/etc/env/configs/

download-prover:
	git -C ${ZKSYNC_PROVER_HOME} checkout ${PROVER_COMMIT} && git -C ${ZKSYNC_PROVER_HOME} pull origin ${PROVER_COMMIT} --ff-only || git clone https://github.com/matter-labs/zksync-era.git ${ZKSYNC_PROVER_HOME} -b ${PROVER_COMMIT}
	cp ${ZKSYNC_ENV}.toml ${ZKSYNC_PROVER_HOME}/etc/env/configs/

download: download-core download-prover download-portal download-explorer

init-explorer:
	cd ${ZKSYNC_EXPLORER_HOME} && \
	export ZKSYNC_HOME=${ZKSYNC_CORE_HOME} && \
	npm i && \
	npm run db:create && \
	npm run build

init-portal:
	cd ${ZKSYNC_PORTAL_HOME} && \
	export ZKSYNC_HOME=${ZKSYNC_CORE_HOME} && \
	npm i && \
	npm run generate:node:shyft

init-core:
	sudo chown -R admin:admin /home/admin/
	cd ${ZKSYNC_CORE_HOME} && \
	export ZKSYNC_HOME=${ZKSYNC_CORE_HOME} && \
	export PATH=${ZKSYNC_CORE_HOME}/bin:$(PATH) && \
	export PATH=/snap/bin:$(PATH) && \
	zk && zk clean --all && zk env ${ZKSYNC_ENV} && zk init --run-observability

init: | init-core init-portal init-explorer

keys:
	cp ${ZKSYNC_CORE_HOME}/etc/env/configs/${ZKSYNC_ENV}.toml ${ZKSYNC_PROVER_HOME}/etc/env/configs/${ZKSYNC_ENV}.toml 
	cp -r ${ZKSYNC_CORE_HOME}/etc/env/l1-inits ${ZKSYNC_CORE_HOME}/etc/env/l2-inits ${ZKSYNC_PROVER_HOME}/etc/env/
	sed -i'' -e 's/^proof_sending_mode =.*/proof_sending_mode = "OnlyRealProofs"/' ${ZKSYNC_PROVER_HOME}/etc/env/base/eth_sender.toml
	sed -i'' -e 's;^setup_data_path =.*;setup_data_path = "vk_setup_data_generator_server_fri/data/";' ${ZKSYNC_PROVER_HOME}/etc/env/base/fri_prover.toml
	sed -i'' -e 's;^universal_setup_path =.*;universal_setup_path = "../keys/setup/setup_2^26.kiey";' ${ZKSYNC_PROVER_HOME}/etc/env/base/fri_proof_compressor.toml
	rm -f ${ZKSYNC_PROVER_HOME}/etc/env/target/${ZKSYNC_ENV}.env
	cd ${ZKSYNC_PROVER_HOME}/prover && \
	export ZKSYNC_HOME=${ZKSYNC_PROVER_HOME} && \
	export PATH=${ZKSYNC_PROVER_HOME}/bin:$(PATH) && \
	export FRI_PROVER_SETUP_DATA_PATH=${ZKSYNC_PROVER_HOME}/prover/vk_setup_data_generator_server_fri/data && \
	zk && zk env ${ZKSYNC_ENV}  && zk f cargo run --features gpu --release --bin key_generator -- generate-sk-gpu all --recompute-if-missing
	cp ${ZKSYNC_PROVER_HOME}/etc/env/target/${ZKSYNC_ENV}.env ${ZKSYNC_CORE_HOME}/etc/env/target/
