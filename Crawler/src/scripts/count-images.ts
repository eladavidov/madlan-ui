import { initDuckDB } from "../database/connectionDuckDB.js";

async function main() {
  const db = await initDuckDB();

  try {
    // Total images
    const totalResult = await db.query("SELECT COUNT(*) as count FROM property_images");
    const total = totalResult[0].count;

    // Downloaded images
    const downloadedResult = await db.query("SELECT COUNT(*) as count FROM property_images WHERE is_downloaded = true");
    const downloaded = downloadedResult[0].count;

    // Properties with images
    const propsWithImagesResult = await db.query("SELECT COUNT(DISTINCT property_id) as count FROM property_images WHERE is_downloaded = true");
    const propsWithImages = propsWithImagesResult[0].count;

    // Total properties
    const totalPropsResult = await db.query("SELECT COUNT(*) as count FROM properties");
    const totalProps = totalPropsResult[0].count;

    console.log("\n📊 Database Statistics:");
    console.log(`  Total properties: ${totalProps}`);
    console.log(`  Properties with images: ${propsWithImages}`);
    console.log(`  Properties needing images: ${totalProps - propsWithImages}`);
    console.log(`  Total image records: ${total}`);
    console.log(`  Downloaded images: ${downloaded}`);

  } finally {
    await db.close();
  }
}

main().catch(console.error);
