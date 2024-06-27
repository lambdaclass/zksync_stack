BUN := $(shell command -v bun 2> /dev/null)

install:
	@if [ ! $(BUN) ]; then \
        echo "bun is not installed. Please install it first."; \
        exit 1; \
    fi
	@echo "Installing monitor service..."
	bun i
	sudo cp monitor.service /lib/systemd/system/
	sudo systemctl enable monitor
.PHONY: install

setup: install
	sudo systemctl daemon-reload
	sudo systemctl start monitor
.PHONY: setup

start:
	@echo "Starting monitor service..."
	sudo systemctl start monitor
.PHONY: start

stop:
	@echo "Stopping monitor service..."
	sudo systemctl stop monitor
.PHONY: stop

reload:
	sudo systemctl daemon-reload
.PHONY: reload

restart:
	sudo sysmtectl restart monitor
.PHONY: restart 

uninstall:
	@echo "Uninstalling monitor service..."
	sudo systemctl stop monitor || true
	sudo systemctl disable monitor || true
	sudo rm -f /lib/systemd/system/monitor.service
	sudo systemctl daemon-reload
.PHONY: uninstall

help:
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@echo "  install	- Install monitor service and enable autostart"
	@echo "  setup		- Set the service up"
	@echo "  start		- Start the monitor service"
	@echo "  stop		- Stop the monitor service"
	@echo "  reload 	- Reload the daemon"
	@echo "  uninstall	- Stop and uninstall the monitor service"    
	@echo "  help		- Display this help message"
.PHONY: help
