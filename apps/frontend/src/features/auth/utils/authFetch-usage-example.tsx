/**
 * @file authFetch-usage-example.tsx
 * @description Example of using authFetch for authenticated API calls
 */


import { useEffect } from "react";
import { authFetch } from "../utils/authFetch";

// Example 1: Simple GET request
async function fetchUserProfile() {
  const response = await authFetch("/api/v1/user/profile");
  const data = await response.json();
  return data;
}

// Example 2: POST request with body
async function updateSettings(settings: any) {
  const response = await authFetch("/api/v1/user/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  return response.json();
}

// Example 3: In a React component
function MyComponent() {
  // Placeholder for setMyData to avoid TS error in example
  const setMyData = (_data: any) => {};
  useEffect(() => {
    async function loadData() {
      try {
        // authFetch automatically:
        // 1. Adds Authorization header
        // 2. Checks if token is expired
        // 3. Refreshes token if needed
        // 4. Retries on 401
        const response = await authFetch("/api/v1/my-data");
        const data = await response.json();
        setMyData(data);
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    }
    loadData();
  }, []);

  return <div>{/* ... */}</div>;
}

// No need to:
// - Manually call refreshTokens()
// - Check token expiry
// - Handle 401 responses
// - Add Authorization headers
// All handled automatically!
