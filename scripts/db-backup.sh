#!/bin/bash
# Deep Dark Social — nightly pg_dump to the Google Drive project folder.
# Runs ON the LA VPS. DB files themselves never live on the Drive mount;
# only these compressed dump files go there.
set -e
STAMP=$(date +%Y%m%d-%H%M)
OUT_DIR="/home/iris/dds-db/backups"
DRIVE_DIR="/mnt/machine-hub/la-vps/My Project Coding /Artificial Intelligence/db-backups"
mkdir -p "$OUT_DIR"
docker exec dds-postgres pg_dump -U dds -d deepdark -Fc > "$OUT_DIR/deepdark-$STAMP.dump"
gzip -f "$OUT_DIR/deepdark-$STAMP.dump"
ls -t "$OUT_DIR"/deepdark-*.dump.gz | tail -n +8 | xargs -r rm -f
mkdir -p "$DRIVE_DIR"
cp "$OUT_DIR/deepdark-$STAMP.dump.gz" "$DRIVE_DIR/"
echo "BACKUP_OK deepdark-$STAMP.dump.gz -> local + Drive"
