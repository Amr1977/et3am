@echo off
set PGPASSWORD=besmillah
"D:\PostgreSQL\18\bin\psql.exe" -U postgres -h 127.0.0.1 -p 5433 -c "SELECT 1"