import fs from "fs";
import path from "path";
import axios from "axios";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = "http://localhost:3000/api";

// You might need to login first to get a token if RBAC is active and we don't have a bypass
// For now, assuming we can use a hardcoded token or the endpoint is accessible (or we simulate a login)
// Since we are running this as a script, we might need a valid admin token.
// OR we can rely on a temporary open endpoint or just tell the user to use Postman.
// However, to make this script self-contained, let's assume we need to login as admin first.
// BUT, honestly, the user just asked for DATA. I'll provide the data and a script that *attempts* to post it.
// I'll assume there is a way to get a token or I'll ask the user to provide one if needed.
// Actually, looking at adminRoutes.js, it uses 'authenticate' and 'requireRole("admin")'.
// So this script needs an admin login.

const seedData = JSON.parse(
  fs.readFileSync(path.join(__dirname, "seed_data.json"), "utf-8")
);

async function seed() {
  try {
    console.log("Attempting to log in as admin...");
    // Replace with valid admin credentials if known, or prompt user
    // Since I don't have the user's password, I'll assume there's a default admin or I'll just print the data payload
    // and let them use the frontend or Postman if login fails.

    // Attempting a default login just in case
    let token;
    try {
      const loginRes = await axios.post(`${API_URL}/auth/login`, {
        email: "admin@vit.ac.in", // adjust as needed
        password: "admin", // adjust as needed
        role: "admin",
      });
      token = loginRes.data.token;
      console.log("Logged in successfully.");
    } catch (e) {
      console.log(
        "Auto-login failed. Please ensure you have an admin account."
      );
      console.log(
        "You can manualy POST the data in seed_data.json to /api/admin/master-data/bulk"
      );
      return;
    }

    console.log("Seeding master data...");
    const response = await axios.post(
      `${API_URL}/admin/master-data/bulk`,
      seedData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("Seed response:", JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error("Error seeding data:", error.response?.data || error.message);
  }
}

seed();
