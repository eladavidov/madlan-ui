/**
 * Create Weekly Database Backup
 * Creates a weekly backup with clear naming for Git commit
 * Deletes old weekly backups to keep only the latest
 */

import { copyFileSync, readdirSync, unlinkSync, statSync, existsSync } from "fs";
import { join } from "path";

function getWeekNumber(date: Date): string {
  const startDate = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startDate.getDay() + 1) / 7);
  return weekNumber.toString().padStart(2, '0');
}

function getBackupName(): string {
  const now = new Date();
  const year = now.getFullYear();
  const week = getWeekNumber(now);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  // Hebrew date format: DD-MM-YYYY
  return `weekly-backup-${day}-${month}-${year}.duckdb`;
}

async function main() {
  const dbDir = "./data/databases";
  const sourceDb = join(dbDir, "properties.duckdb");
  const backupName = getBackupName();
  const backupPath = join(dbDir, backupName);

  // Check if source database exists
  if (!existsSync(sourceDb)) {
    console.error("❌ Source database not found:", sourceDb);
    process.exit(1);
  }

  // Get database size
  const stats = statSync(sourceDb);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

  console.log("\n📦 Creating Weekly Database Backup");
  console.log("=".repeat(60));
  console.log(`Source: ${sourceDb}`);
  console.log(`Size: ${sizeMB} MB`);
  console.log(`Backup: ${backupName}`);
  console.log("=".repeat(60));

  // Check if crawler is running
  console.log("\n⚠️  IMPORTANT: Stop the crawler before creating backup!");
  console.log("   Database must not be in use during backup.");

  // Delete old weekly backups
  try {
    const files = readdirSync(dbDir);
    const oldBackups = files.filter(f => f.startsWith("weekly-backup-") && f !== backupName);

    if (oldBackups.length > 0) {
      console.log(`\n🗑️  Deleting ${oldBackups.length} old weekly backup(s):`);
      for (const oldBackup of oldBackups) {
        const oldPath = join(dbDir, oldBackup);
        unlinkSync(oldPath);
        console.log(`   ✅ Deleted: ${oldBackup}`);
      }
    }
  } catch (error: any) {
    console.warn("⚠️  Could not delete old backups:", error.message);
  }

  // Create new backup
  try {
    const now = new Date();
    const day = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear();

    copyFileSync(sourceDb, backupPath);
    const backupStats = statSync(backupPath);
    const backupSizeMB = (backupStats.size / (1024 * 1024)).toFixed(2);

    console.log(`\n✅ Backup created successfully!`);
    console.log(`   File: ${backupName}`);
    console.log(`   Size: ${backupSizeMB} MB`);
    console.log(`\n📋 Next steps:`);
    console.log(`   1. git add ${backupPath}`);
    console.log(`   2. git commit -m "chore: weekly database backup (${day}-${month}-${year})"`);
    console.log(`   3. git push`);
    console.log("\n💡 Old backups were deleted automatically");
  } catch (error: any) {
    if (error.code === "EBUSY" || error.message.includes("locked") || error.message.includes("busy")) {
      console.error("\n❌ Database is locked (crawler is running)");
      console.error("\n📋 To create backup:");
      console.error("   1. Stop the crawler first (Ctrl+C or kill process)");
      console.error("   2. Run this script again");
      console.error("   3. Restart the crawler after backup completes");
      process.exit(1);
    }
    console.error("❌ Failed to create backup:", error.message);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
