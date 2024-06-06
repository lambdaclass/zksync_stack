.PHONY: setup download setup-keys run-gpu server prover-gateway witness-generators witness-vector-generator prover compressor explorer portal

export PATH=$HOME/.local/bin:$$PATH

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
PORTAL_COMMIT=8471411eebcae55dba940bee492ba6cb74a167d3
# Private keys
DEPLOYER_PRIVATE_KEY=
GOVERNANCE_PRIVATE_KEY=
GOVERNOR_PRIVATE_KEY=
# Envs
ZKSYNC_ENV=shyft


# General

deps:
	mkdir -p ~/.local/bin
	sudo apt install -y moreutils wget tmux
	wget https://github.com/mikefarah/yq/releases/latest/download/yq_linux_amd64 -O ~/.local/bin/yq &&\
	    chmod +x ~/.local/bin/yq

# Download

download-server: deps
	git -C ${ZKSYNC_SERVER_HOME} pull origin ${SERVER_COMMIT}:${SERVER_COMMIT} --ff-only || git clone ${SERVER_REPO} ${ZKSYNC_SERVER_HOME}
	git -C ${ZKSYNC_SERVER_HOME} checkout ${SERVER_COMMIT}
	cp diffs/observability.diff ${ZKSYNC_SERVER_HOME}
	cp ${ZKSYNC_ENV}.toml ${ZKSYNC_SERVER_HOME}/etc/env/configs/
	git -C ${ZKSYNC_SERVER_HOME} apply observability.diff || exit 0

download-explorer: deps
	git -C ${ZKSYNC_EXPLORER_HOME} pull origin ${EXPLORER_COMMIT}:${EXPLORER_COMMIT} --ff-only || git clone ${EXPLORER_REPO} ${ZKSYNC_EXPLORER_HOME}
	git -C ${ZKSYNC_EXPLORER_HOME} checkout ${EXPLORER_COMMIT}
	cp configs/explorer.config.json ${ZKSYNC_EXPLORER_HOME}/packages/app/src/configs/hyperchain.config.json
	cp diffs/explorer.diff ${ZKSYNC_EXPLORER_HOME}
	git -C ${ZKSYNC_EXPLORER_HOME} apply explorer.diff || exit 0	

download-portal: deps
	git -C ${ZKSYNC_PORTAL_HOME} pull origin ${PORTAL_COMMIT}:${PORTAL_COMMIT} --ff-only || git clone ${PORTAL_REPO} ${ZKSYNC_PORTAL_HOME}
	git -C ${ZKSYNC_PORTAL_HOME} checkout ${PORTAL_COMMIT}
	cp configs/portal.config.json ${ZKSYNC_PORTAL_HOME}/hyperchains/config.json
	cp diffs/portal.diff ${ZKSYNC_PORTAL_HOME}
	git -C ${ZKSYNC_PORTAL_HOME} apply portal.diff || exit 0

# Setup

## Server

setup-server: download-server

## Explorer

setup-explorer: ZKSYNC_HOME=$(ZKSYNC_CORE_HOME)
setup-explorer: DATABASE_HOST=127.0.0.1
setup-explorer: DATABASE_USER=postgres
setup-explorer: DATABASE_PASSWORD=notsecurepassword
setup-explorer: DATABASE_URL=postgres://postgres:notsecurepassword@127.0.0.1:5432/block-explorer
setup-explorer: BLOCKCHAIN_RPC_URL=http://127.0.0.1:3050
setup-explorer: download-explorer
	cd $(ZKSYNC_EXPLORER_HOME) ; npm install
	cd $(ZKSYNC_EXPLORER_HOME)/packages/worker ; npm run db:create || exit 0
	cd $(ZKSYNC_EXPLORER_HOME) ; npm run build

## Portal

setup-portal:
	cd $(ZKSYNC_PORTAL_HOME) ; \
		npm install && \
		npm run generate:node:shyft

# Run

run-explorer: $(ZKSYNC_EXPLORER_HOME)
	cd $(ZKSYNC_EXPLORER_HOME) ; npm run dev

run-portal: $(ZKSYNC_PORTAL_HOME)
	cd $(ZKSYNC_PORTAL_HOME) ; npx serve .output/public -p 3002

# Main

explorer:
	tmux kill-session -t explorer || exit 0
	tmux new -d -s explorer
	tmux send-keys -t explorer "make setup-explorer run-explorer" Enter

portal: setup-portal
	tmux kill-session -t portal || exit 0
	tmux new -d -s portal
	tmux send-keys -t portal "make setup-portal run-portal" Enter
