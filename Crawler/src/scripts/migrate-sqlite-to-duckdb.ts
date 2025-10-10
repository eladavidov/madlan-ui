/**
 * Migration Script: SQLite → DuckDB
 * Migrates all data from existing SQLite database to new DuckDB database
 * Preserves existing data while adding enhanced schema
 */

import { DatabaseConnection } from '../database/connection.js';
import { DuckDBConnection } from '../database/connectionDuckDB.js';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface MigrationStats {
  propertiesMigrated: number;
  imagesMigrated: number;
  propertiesFailed: number;
  imagesFailed: number;
  errors: string[];
}

async function migrateSQLiteToDuckDB() {
  console.log('🔄 Starting SQLite → DuckDB Migration...\n');

  const stats: MigrationStats = {
    propertiesMigrated: 0,
    imagesMigrated: 0,
    propertiesFailed: 0,
    imagesFailed: 0,
    errors: []
  };

  try {
    // Paths
    const sqlitePath = path.join(__dirname, '..', '..', 'data', 'databases', 'properties.db');
    const duckdbPath = path.join(__dirname, '..', '..', 'data', 'databases', 'properties.duckdb');

    console.log('📂 Source (SQLite):', sqlitePath);
    console.log('📂 Target (DuckDB):', duckdbPath);
    console.log();

    // Initialize SQLite connection
    console.log('📊 Connecting to SQLite database...');
    const sqliteDb = new DatabaseConnection(sqlitePath);
    await sqliteDb.initialize();
    console.log('✅ SQLite connection established');

    // Initialize DuckDB connection
    console.log('📊 Connecting to DuckDB database...');
    const duckDb = new DuckDBConnection(duckdbPath);
    await duckDb.initialize();
    console.log('✅ DuckDB connection established\n');

    // Migrate properties
    console.log('🔍 Reading properties from SQLite...');
    const properties = sqliteDb.query<any>('SELECT * FROM properties');
    console.log(`   Found ${properties.length} properties to migrate\n`);

    console.log('💾 Migrating properties to DuckDB...');
    for (const property of properties) {
      try {
        await duckDb.execute(
          `INSERT INTO properties (
            id, url, source_url, price, rooms, size, floor, total_floors,
            address, neighborhood, city, property_type, description,
            has_parking, parking_spaces, has_elevator, has_balcony, balcony_size,
            has_air_conditioning, has_security_door, has_bars, has_storage,
            has_shelter, is_accessible, is_renovated, is_furnished,
            entry_date, listing_date, last_updated,
            contact_name, contact_phone, contact_agency,
            first_crawled_at, last_crawled_at, crawl_count,
            data_complete, has_errors, error_notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            property.id,
            property.url,
            property.source_url,
            property.price,
            property.rooms,
            property.size,
            property.floor,
            property.total_floors,
            property.address,
            property.neighborhood,
            property.city,
            property.property_type,
            property.description,
            property.has_parking,
            property.parking_spaces,
            property.has_elevator,
            property.has_balcony,
            property.balcony_size,
            property.has_air_conditioning,
            property.has_security_door,
            property.has_bars,
            property.has_storage,
            property.has_shelter,
            property.is_accessible,
            property.is_renovated,
            property.is_furnished,
            property.entry_date,
            property.listing_date,
            property.last_updated,
            property.contact_name,
            property.contact_phone,
            property.contact_agency,
            property.first_crawled_at,
            property.last_crawled_at,
            property.crawl_count,
            property.data_complete,
            property.has_errors,
            property.error_notes
          ]
        );
        stats.propertiesMigrated++;
        if (stats.propertiesMigrated % 10 === 0) {
          process.stdout.write(`\r   Migrated ${stats.propertiesMigrated}/${properties.length} properties...`);
        }
      } catch (error: any) {
        stats.propertiesFailed++;
        stats.errors.push(`Property ${property.id}: ${error.message}`);
      }
    }
    console.log(`\r   ✅ Migrated ${stats.propertiesMigrated}/${properties.length} properties\n`);

    // Migrate images
    // Check if images table exists in SQLite
    const imagesTableExists = sqliteDb.queryOne<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='images'"
    );

    if (imagesTableExists) {
      console.log('🔍 Reading images from SQLite...');
      const images = sqliteDb.query<any>('SELECT * FROM images');
      console.log(`   Found ${images.length} images to migrate\n`);

      console.log('💾 Migrating images to DuckDB...');
      for (const image of images) {
        try {
          await duckDb.execute(
            `INSERT INTO property_images (
              id, property_id, image_url, image_order, is_main_image,
              image_type, width, height, file_size,
              is_downloaded, local_path, download_date, download_error,
              created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              image.id,
              image.property_id,
              image.image_url,
              image.image_order,
              image.is_main_image,
              image.image_type,
              image.width,
              image.height,
              image.file_size,
              image.is_downloaded,
              image.local_path,
              image.download_date,
              image.download_error,
              image.created_at
            ]
          );
          stats.imagesMigrated++;
          if (stats.imagesMigrated % 50 === 0) {
            process.stdout.write(`\r   Migrated ${stats.imagesMigrated}/${images.length} images...`);
          }
        } catch (error: any) {
          stats.imagesFailed++;
          stats.errors.push(`Image ${image.id}: ${error.message}`);
        }
      }
      console.log(`\r   ✅ Migrated ${stats.imagesMigrated}/${images.length} images\n`);
    } else {
      console.log('ℹ️  No images table found in SQLite (skipping)\n');
    }

    // Close connections
    console.log('🔒 Closing database connections...');
    sqliteDb.close();
    await duckDb.close();
    console.log('✅ Connections closed\n');

    // Print summary
    console.log('='.repeat(60));
    console.log('🎉 MIGRATION COMPLETED!');
    console.log('='.repeat(60));
    console.log(`\n📊 Migration Statistics:`);
    console.log(`   ✅ Properties migrated: ${stats.propertiesMigrated}`);
    console.log(`   ✅ Images migrated: ${stats.imagesMigrated}`);

    if (stats.propertiesFailed > 0 || stats.imagesFailed > 0) {
      console.log(`   ⚠️  Properties failed: ${stats.propertiesFailed}`);
      console.log(`   ⚠️  Images failed: ${stats.imagesFailed}`);
    }

    if (stats.errors.length > 0) {
      console.log(`\n❌ Errors (${stats.errors.length}):`);
      stats.errors.slice(0, 10).forEach((err) => console.log(`   - ${err}`));
      if (stats.errors.length > 10) {
        console.log(`   ... and ${stats.errors.length - 10} more errors`);
      }
    }

    console.log('\n💡 Next Steps:');
    console.log('   1. Update .env to set DB_TYPE=duckdb');
    console.log('   2. Test existing crawler with DuckDB connection');
    console.log('   3. Start implementing enhanced extractors (Phase 5B)\n');

    process.exit(stats.propertiesFailed > 0 || stats.imagesFailed > 0 ? 1 : 0);
  } catch (error: any) {
    console.error('\n❌ MIGRATION FAILED:', error);
    console.error('\n📋 Error details:');
    console.error(`   Message: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
    process.exit(1);
  }
}

// Run migration
migrateSQLiteToDuckDB();
