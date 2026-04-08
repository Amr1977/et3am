@echo off
echo Creating database et3am...
"D:\PostgreSQL\18\bin\psql.exe" -U postgres -h localhost -p 5433 -c "CREATE DATABASE et3am;"
pause