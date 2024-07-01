#!/usr/bin/env bash
set -e
    
pg_restore --clean --exit-on-error -j $(nproc --all) -d postgres -U postgres --no-owner --no-privileges --disable-triggers /pg_backups/main_node.dump
