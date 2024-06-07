utils.test: init
	bun run scripts/loadTester.ts
.PHONY: utils.test

utils.test.tmux: init
	tmux kill-session -t ltester; \
	tmux new -d -s ltester; \
	tmux send-keys -t ltester "direnv allow" Enter;
	tmux send-keys -t ltester "bun run scripts/loadTester.ts" Enter;
.PHONY: utils.test.tmux

init:
	bun i
.PHONY: init

