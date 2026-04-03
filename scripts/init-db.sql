-- Create the app user with least privilege
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'fld_app_user') THEN
    CREATE ROLE fld_app_user WITH LOGIN PASSWORD 'fold_app_password';
  END IF;
END
$$;

GRANT CONNECT ON DATABASE fold TO fld_app_user;
GRANT USAGE ON SCHEMA public TO fld_app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO fld_app_user;
