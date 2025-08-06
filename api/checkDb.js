require("dotenv").config();
const { sequelize, Trade, Strategy, Tag, Image } = require("./models");

async function checkDatabase() {
  try {
    // Test connection
    await sequelize.authenticate();
    console.log("✅ Database connection successful");

    // Check table counts
    const strategiesCount = await Strategy.count();
    const tagsCount = await Tag.count();
    const tradesCount = await Trade.count();
    const imagesCount = await Image.count();

    console.log("\n📊 Database Statistics:");
    console.log(`Strategies: ${strategiesCount}`);
    console.log(`Tags: ${tagsCount}`);
    console.log(`Trades: ${tradesCount}`);
    console.log(`Images: ${imagesCount}`);

    // Show sample data
    if (strategiesCount > 0) {
      console.log("\n📝 Sample Strategies:");
      const strategies = await Strategy.findAll({ limit: 3 });
      strategies.forEach((s) => console.log(`  - ${s.name}: ${s.description}`));
    }

    if (tagsCount > 0) {
      console.log("\n🏷️  Sample Tags:");
      const tags = await Tag.findAll({ limit: 3 });
      tags.forEach((t) => console.log(`  - ${t.name}: ${t.description}`));
    }

    console.log("\n🎉 Database is ready for use!");
    console.log("\n📚 Migration Commands:");
    console.log("  npm run db:migrate      - Run migrations");
    console.log("  npm run db:seed         - Run seeders");
    console.log("  npm run db:reset        - Reset database");
    console.log("  npm run db:migrate:undo - Undo last migration");
  } catch (error) {
    console.error("❌ Database error:", error);
  } finally {
    await sequelize.close();
  }
}

checkDatabase();
