require("dotenv").config();
const { sequelize, Trade, Strategy, Tag, Image } = require("./models");

async function initializeDatabase() {
  try {
    // Test the connection
    await sequelize.authenticate();
    console.log("✅ Database connection established successfully.");

    // Create all tables (force: true will drop existing tables)
    // Set force: false for production to preserve data
    await sequelize.sync({ force: false });
    console.log("✅ All models were synchronized successfully.");

    // Optional: Create some sample data if tables are empty
    await seedDatabase();

    console.log("🎉 Database initialization completed!");
  } catch (error) {
    console.error("❌ Unable to connect to the database:", error);
    process.exit(1);
  }
}

async function seedDatabase() {
  try {
    // Check if we already have data
    const strategiesCount = await Strategy.count();
    const tagsCount = await Tag.count();

    if (strategiesCount === 0) {
      console.log("📝 Creating sample strategies...");
      await Strategy.bulkCreate([
        { name: "Scalping", description: "Quick trades for small profits" },
        {
          name: "Swing Trading",
          description: "Medium-term trades (days to weeks)",
        },
        { name: "Day Trading", description: "Intraday trades" },
        {
          name: "Long Term Hold",
          description: "Buy and hold for months/years",
        },
      ]);
      console.log("✅ Sample strategies created.");
    }

    if (tagsCount === 0) {
      console.log("📝 Creating sample tags...");
      await Tag.bulkCreate([
        { name: "Entry", description: "Trade entry screenshots" },
        { name: "Exit", description: "Trade exit screenshots" },
        { name: "Chart Analysis", description: "Technical analysis charts" },
        { name: "News", description: "Related news screenshots" },
        { name: "Setup", description: "Trade setup screenshots" },
      ]);
      console.log("✅ Sample tags created.");
    }

    console.log("✅ Database seeding completed.");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  }
}

// Run the initialization
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Database initialization failed:", error);
      process.exit(1);
    });
}

module.exports = { initializeDatabase, seedDatabase };
