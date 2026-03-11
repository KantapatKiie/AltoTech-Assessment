#!/bin/sh
set -e

echo "Waiting for database..."
until python -c "import os, psycopg2; psycopg2.connect(dbname=os.getenv('POSTGRES_DB','altotech'), user=os.getenv('POSTGRES_USER','altotech'), password=os.getenv('POSTGRES_PASSWORD','altotech'), host=os.getenv('POSTGRES_HOST','db'), port=os.getenv('POSTGRES_PORT','5432')).close()"; do
	sleep 1
done

python manage.py migrate
python manage.py seed_data
python manage.py runserver 0.0.0.0:8000
