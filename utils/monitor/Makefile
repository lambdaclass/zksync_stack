BUN := $(shell command -v bun 2> /dev/null)
SERVICE := monitor

install:
	@if [ ! $(BUN) ]; then \
        echo "bun is not installed. Please install it first."; \
        exit 1; \
    fi
	@echo "Installing ${SERVICE} service..."
	bun i
	sudo cp ${SERVICE}.service /lib/systemd/system/
	sudo systemctl enable ${SERVICE}
.PHONY: install

setup: install
	sudo systemctl daemon-reload
	sudo systemctl start ${SERVICE}
.PHONY: setup

start:
	@echo "Starting ${SERVICE} service..."
	sudo systemctl start ${SERVICE}
.PHONY: start

stop:
	@echo "Stopping ${SERVICE} service..."
	sudo systemctl stop ${SERVICE}
.PHONY: stop

reload:
	sudo systemctl daemon-reload
.PHONY: reload

restart:
	sudo systemctl restart ${SERVICE}
.PHONY: restart 

uninstall:
	@echo "Uninstalling ${SERVICE} service..."
	sudo systemctl stop ${SERVICE} || true
	sudo systemctl disable ${SERVICE} || true
	sudo rm -f /lib/systemd/system/${SERVICE}.service
	sudo systemctl daemon-reload
.PHONY: uninstall

help:
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@echo "  install	- Install ${SERVICE} service and enable autostart"
	@echo "  setup		- Set the service up"
	@echo "  start		- Start the ${SERVICE} service"
	@echo "  stop		- Stop the ${SERVICE} service"
	@echo "  reload 	- Reload the daemon"
	@echo "  uninstall	- Stop and uninstall the ${SERVICE} service"
	@echo "  help		- Display this help message"
.PHONY: help
