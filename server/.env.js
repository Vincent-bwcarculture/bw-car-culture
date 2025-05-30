// server/.env.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ES Module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Direct .env loading to ensure environment variables are set
console.log("📄 Loading environment variables directly...");

const envPath = path.join(__dirname, "../.env");

if (fs.existsSync(envPath)) {
  console.log(`Found .env file at ${envPath}`);

  try {
    const envContent = fs.readFileSync(envPath, "utf8");
    const envLines = envContent.split("\n");

    envLines.forEach((line) => {
      // Skip comments and empty lines
      if (line.trim().startsWith("#") || !line.trim()) return;

      // Parse key-value pairs
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^['"]|['"]$/g, ""); // Remove quotes

        // Only set if not already defined
        if (!process.env[key]) {
          process.env[key] = value;

          // Log without exposing secrets
          if (key.includes("SECRET") || key.includes("KEY")) {
            console.log(`${key}: [HIDDEN]`);
          } else {
            console.log(`${key}: ${value}`);
          }
        }
      }
    });

    console.log("✅ Environment variables loaded successfully");
  } catch (error) {
    console.error("Error reading .env file:", error);
  }
} else {
  console.log("⚠️ No .env file found at", envPath);
}

// Export a function to reload environment variables
export const reloadEnvironment = () => {
  if (fs.existsSync(envPath)) {
    try {
      const envContent = fs.readFileSync(envPath, "utf8");
      const envLines = envContent.split("\n");

      let count = 0;
      envLines.forEach((line) => {
        // Skip comments and empty lines
        if (line.trim().startsWith("#") || !line.trim()) return;

        // Parse key-value pairs
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim().replace(/^['"]|['"]$/g, ""); // Remove quotes

          // Set environment variable
          process.env[key] = value;
          count++;
        }
      });

      return {
        success: true,
        count,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  return {
    success: false,
    error: "No .env file found",
  };
};

export default {
  reloadEnvironment,
};
