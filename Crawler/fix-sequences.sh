#!/bin/bash
# Revert the incorrect changes
cd src/database
git checkout schema-duckdb.sql 2>/dev/null || echo "No git, continuing..."

# Add sequences before each table that needs them
sed -i '/^CREATE TABLE IF NOT EXISTS property_images/i\CREATE SEQUENCE IF NOT EXISTS seq_property_images_id START 1;\n' schema-duckdb.sql
sed -i 's/CREATE TABLE IF NOT EXISTS property_images (/CREATE TABLE IF NOT EXISTS property_images (\n  id INTEGER PRIMARY KEY DEFAULT nextval('\''seq_property_images_id'\''),/' schema-duckdb.sql
sed -i 's/property_images (\n  id INTEGER PRIMARY KEY,/property_images (/' schema-duckdb.sql

sed -i '/^CREATE TABLE IF NOT EXISTS transaction_history/i\CREATE SEQUENCE IF NOT EXISTS seq_transaction_history_id START 1;\n' schema-duckdb.sql
sed -i '/transaction_history (/,/id INTEGER PRIMARY KEY,/s/id INTEGER PRIMARY KEY,/id INTEGER PRIMARY KEY DEFAULT nextval('\''seq_transaction_history_id'\''),/' schema-duckdb.sql

sed -i '/^CREATE TABLE IF NOT EXISTS nearby_schools/i\CREATE SEQUENCE IF NOT EXISTS seq_nearby_schools_id START 1;\n' schema-duckdb.sql  
sed -i '/nearby_schools (/,/id INTEGER PRIMARY KEY,/s/id INTEGER PRIMARY KEY,/id INTEGER PRIMARY KEY DEFAULT nextval('\''seq_nearby_schools_id'\''),/' schema-duckdb.sql

sed -i '/^CREATE TABLE IF NOT EXISTS neighborhood_ratings/i\CREATE SEQUENCE IF NOT EXISTS seq_neighborhood_ratings_id START 1;\n' schema-duckdb.sql
sed -i '/neighborhood_ratings (/,/id INTEGER PRIMARY KEY,/s/id INTEGER PRIMARY KEY,/id INTEGER PRIMARY KEY DEFAULT nextval('\''seq_neighborhood_ratings_id'\''),/' schema-duckdb.sql

sed -i '/^CREATE TABLE IF NOT EXISTS price_comparisons/i\CREATE SEQUENCE IF NOT EXISTS seq_price_comparisons_id START 1;\n' schema-duckdb.sql
sed -i '/price_comparisons (/,/id INTEGER PRIMARY KEY,/s/id INTEGER PRIMARY KEY,/id INTEGER PRIMARY KEY DEFAULT nextval('\''seq_price_comparisons_id'\''),/' schema-duckdb.sql

sed -i '/^CREATE TABLE IF NOT EXISTS new_construction_projects/i\CREATE SEQUENCE IF NOT EXISTS seq_new_construction_projects_id START 1;\n' schema-duckdb.sql
sed -i '/new_construction_projects (/,/id INTEGER PRIMARY KEY,/s/id INTEGER PRIMARY KEY,/id INTEGER PRIMARY KEY DEFAULT nextval('\''seq_new_construction_projects_id'\''),/' schema-duckdb.sql

sed -i '/^CREATE TABLE IF NOT EXISTS crawl_sessions/i\CREATE SEQUENCE IF NOT EXISTS seq_crawl_sessions_id START 1;\n' schema-duckdb.sql
sed -i '/crawl_sessions (/,/id INTEGER PRIMARY KEY,/s/id INTEGER PRIMARY KEY,/id INTEGER PRIMARY KEY DEFAULT nextval('\''seq_crawl_sessions_id'\''),/' schema-duckdb.sql

sed -i '/^CREATE TABLE IF NOT EXISTS crawl_errors/i\CREATE SEQUENCE IF NOT EXISTS seq_crawl_errors_id START 1;\n' schema-duckdb.sql
sed -i '/crawl_errors (/,/id INTEGER PRIMARY KEY,/s/id INTEGER PRIMARY KEY,/id INTEGER PRIMARY KEY DEFAULT nextval('\''seq_crawl_errors_id'\''),/' schema-duckdb.sql

echo "Sequences added successfully"
