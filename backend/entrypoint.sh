#!/bin/sh
# Apply migrations against the mounted SQLite volume, then serve.
set -e

python manage.py migrate --no-input

# runserver (not gunicorn) keeps this faithful to a local-only app and serves
# the Django admin's static files without extra deps.
exec python manage.py runserver 0.0.0.0:8000
