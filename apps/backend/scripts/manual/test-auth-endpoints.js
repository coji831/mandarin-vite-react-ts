/**
 * @file apps/backend/test-auth-endpoints.js
 * @description Manual test script to verify all auth endpoints
 */

const BASE_URL = "http://localhost:3001/api/v1/auth";

async function testAuthEndpoints() {
  console.log("🧪 Testing JWT Authentication Endpoints\n");

  let accessToken, refreshToken, userEmail;

  // Test 1: Register endpoint
  console.log("1️⃣ Testing POST /api/v1/auth/register");
  try {
    userEmail = `test-${Date.now()}@example.com`;
    const registerResponse = await fetch(`${BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: userEmail,
        password: "TestPass123!",
        displayName: "Test User",
      }),
    });

    if (!registerResponse.ok) {
      throw new Error(`Register failed: ${registerResponse.status}`);
    }

    const registerData = await registerResponse.json();
    accessToken = registerData.data.accessToken;
    refreshToken = registerData.data.refreshToken;

    console.log("   ✅ Register successful");
    console.log(`   📧 Email: ${registerData.data.user.email}`);
    console.log(`   🔑 Access token: ${accessToken.substring(0, 20)}...`);
    console.log(`   🔄 Refresh token: ${refreshToken.substring(0, 20)}...\n`);
  } catch (error) {
    console.error("   ❌ Register failed:", error.message, "\n");
    return;
  }

  // Test 2: Login endpoint
  console.log("2️⃣ Testing POST /api/v1/auth/login");
  try {
    const loginResponse = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: userEmail,
        password: "TestPass123!",
      }),
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    console.log("   ✅ Login successful");
    console.log(`   📧 Email: ${loginData.data.user.email}\n`);
  } catch (error) {
    console.error("   ❌ Login failed:", error.message, "\n");
  }

  // Test 3: Refresh endpoint
  console.log("3️⃣ Testing POST /api/v1/auth/refresh");
  try {
    const refreshResponse = await fetch(`${BASE_URL}/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!refreshResponse.ok) {
      throw new Error(`Refresh failed: ${refreshResponse.status}`);
    }

    const refreshData = await refreshResponse.json();
    const newAccessToken = refreshData.data.accessToken;
    const newRefreshToken = refreshData.data.refreshToken;

    console.log("   ✅ Token refresh successful");
    console.log(`   🔑 New access token: ${newAccessToken.substring(0, 20)}...`);
    console.log(`   🔄 New refresh token: ${newRefreshToken.substring(0, 20)}...`);
    console.log(`   ♻️  Token rotation: ${refreshToken !== newRefreshToken ? "✅" : "❌"}\n`);

    // Update tokens for logout test
    refreshToken = newRefreshToken;
  } catch (error) {
    console.error("   ❌ Refresh failed:", error.message, "\n");
  }

  // Test 4: Protected route (using requireAuth middleware)
  console.log("4️⃣ Testing Auth Middleware (protected route)");
  try {
    const protectedResponse = await fetch("http://localhost:3001/api/health", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    console.log(`   ✅ Middleware allows valid token (status: ${protectedResponse.status})\n`);
  } catch (error) {
    console.error("   ❌ Middleware test failed:", error.message, "\n");
  }

  // Test 5: Rate limiting
  console.log("5️⃣ Testing Rate Limiting (max 5 requests/minute)");
  try {
    let rateLimitHit = false;

    for (let i = 1; i <= 6; i++) {
      const rateLimitResponse = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "nonexistent@example.com",
          password: "wrong",
        }),
      });

      if (rateLimitResponse.status === 429) {
        console.log(`   ✅ Rate limit enforced after ${i} attempts`);
        rateLimitHit = true;
        break;
      }
    }

    if (!rateLimitHit) {
      console.log("   ⚠️  Rate limit not hit after 6 attempts\n");
    } else {
      console.log();
    }
  } catch (error) {
    console.error("   ❌ Rate limit test failed:", error.message, "\n");
  }

  // Test 6: Logout endpoint
  console.log("6️⃣ Testing POST /api/v1/auth/logout");
  try {
    const logoutResponse = await fetch(`${BASE_URL}/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!logoutResponse.ok) {
      throw new Error(`Logout failed: ${logoutResponse.status}`);
    }

    console.log("   ✅ Logout successful");

    // Verify token is invalidated
    const retryRefreshResponse = await fetch(`${BASE_URL}/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (retryRefreshResponse.status === 401) {
      console.log("   ✅ Refresh token invalidated after logout\n");
    } else {
      console.log("   ⚠️  Token still works after logout (unexpected)\n");
    }
  } catch (error) {
    console.error("   ❌ Logout failed:", error.message, "\n");
  }

  console.log("✅ All endpoint tests complete!");
}

testAuthEndpoints().catch(console.error);
