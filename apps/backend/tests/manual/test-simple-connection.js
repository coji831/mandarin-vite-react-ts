import "dotenv/config";
import pkg from "pg";
const { Client } = pkg;

const connectionString = process.env.DATABASE_URL;

console.log("Testing connection to:", connectionString?.replace(/:[^:]*@/, ":****@"));

const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false, // Required for Supabase
  },
});

async function testConnection() {
  try {
    console.log("Connecting...");
    await client.connect();
    console.log("✅ Connected successfully!");

    const result = await client.query("SELECT NOW(), current_database(), version()");
    console.log("\n📊 Database Info:");
    console.log("- Current time:", result.rows[0].now);
    console.log("- Database:", result.rows[0].current_database);
    console.log("- Version:", result.rows[0].version.substring(0, 50) + "...");

    // Test if we can create a table
    await client.query("SELECT 1");
    console.log("\n✅ Database is accessible and ready!");
  } catch (error) {
    console.error("\n❌ Connection failed!");
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);

    if (error.code === "ENOTFOUND") {
      console.error("\n💡 Possible causes:");
      console.error("   1. Supabase project is paused (check dashboard)");
      console.error("   2. Wrong hostname in connection string");
    } else if (error.code === "ECONNREFUSED") {
      console.error("\n💡 Possible causes:");
      console.error("   1. Firewall blocking port 5432");
      console.error("   2. Supabase project is starting up (wait 2 min)");
    } else if (error.code === "28P01") {
      console.error("\n💡 Wrong password! Update DATABASE_URL with correct password");
    }

    console.error("\nFull error:", error);
  } finally {
    await client.end();
  }
}

testConnection();
