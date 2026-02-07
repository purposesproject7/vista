
import fetch from "node-fetch";

async function login() {
    try {
        const response = await fetch("http://localhost:3000/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                emailId: "guide_ppt@test.com",
                password: "password123",
                expectedRole: "faculty"
            })
        });

        const data = await response.json();
        console.log(`Status: ${response.status}`);
        console.log("Body:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Error:", e);
    }
}

login();
