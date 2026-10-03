
const API_URL = 'http://localhost:5000/api';

async function run() {
    try {
        // 1. Login
        console.log('Logging in...');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                emailId: 'admin@vit.ac.in',
                password: 'Vitadmin@123'
            })
        });

        if (!loginRes.ok) {
            console.log('Login failed: ' + loginRes.status);
            const err = await loginRes.json();
            console.log(err);
            return;
        }

        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('Got token:', token ? 'Yes' : 'No');

        if (!token) {
            console.error('Failed to get token');
            return;
        }

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        // 2. Prepare payload that triggers the issue
        const payload = {
            panelName: "Test Panel 404",
            memberEmployeeIds: ["1001", "1002"],
            academicYear: "2026-2027",
            school: "NON_EXISTENT_SCHOOL",
            program: "NON_EXISTENT_PROGRAM"
        };

        console.log('Sending panel creation request...');
        const res = await fetch(`${API_URL}/admin/panels`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        console.log('Response Status:', res.status);
        console.log('Response Data:', data);

        if (res.status === 404 && data.message === "Program configuration not found.") {
            console.log('✓ Reproduction SUCCESS: Got expected 404 error.');
        } else if (res.status === 400 && data.message.includes("Faculty")) {
            console.log('⚠ Reproduction Partial: Validation failed on Faculty IDs before Config check.');
            // This might happen if 'validatePanelSize' is AFTER 'validateRequired' but maybe strict checking is somewhere else?
            // Actually validatePanelSize checks config FIRST in middleware stack (if placed early).
            // Let's see. logic:
            // router.post(..., validatePanelSize, adminController...)
            // validatePanelSize DOES check config first.
        } else {
            console.log('x Reproduction FAILED: Got different error/success.');
        }

    } catch (err) {
        console.error('Script error:', err.message);
    }
}

run();
