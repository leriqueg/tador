-- Runs only when the Postgres data volume is first created.
-- For existing volumes, `make test-db` creates tador_test if missing.
CREATE DATABASE tador_test;
