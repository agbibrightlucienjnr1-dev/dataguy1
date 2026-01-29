// Quick test of wallet & commission system

const BASE_URL = "http://localhost:3000";

async function testWalletSystem() {
  console.log("=== WALLET & COMMISSION SYSTEM TEST ===\n");

  try {
    // 1. Login as agent
    console.log("1. Logging in as agent...");
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: "0241234567",
        password: "Test@1234",
      }),
    });
    const loginData = await loginRes.json();
    const token = loginData.data.token;
    const agentCode = loginData.data.user.paymentLinkCode;
    console.log("✓ Logged in successfully");
    console.log(`  Payment Link Code: ${agentCode}\n`);

    // 2. Check wallet before
    console.log("2. Checking wallet balance...");
    const walletRes = await fetch(`${BASE_URL}/api/wallet`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const walletData = await walletRes.json();
    console.log(`✓ Current Balance: GH₵ ${walletData.data.wallet.balance}`);
    console.log(`  Total Earned: GH₵ ${walletData.data.wallet.totalEarned}\n`);

    // 3. Get available bundles
    console.log("3. Getting available bundles...");
    const bundlesRes = await fetch(
      `${BASE_URL}/api/orders/link/${agentCode}/bundles`,
    );
    const bundlesData = await bundlesRes.json();
    const firstNetwork = Object.keys(bundlesData.data.bundles)[0];
    const firstBundle = bundlesData.data.bundles[firstNetwork][0];
    console.log(`✓ Found bundle: ${firstBundle.network} ${firstBundle.volume}`);
    console.log(`  Price: GH₵ ${firstBundle.price}\n`);

    // 4. Create order
    console.log("4. Creating test order...");
    const orderRes = await fetch(
      `${BASE_URL}/api/orders/link/${agentCode}/purchase`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerPhone: "0501234567",
          customerName: "Test Customer",
          bundleId: firstBundle.id,
        }),
      },
    );
    const orderData = await orderRes.json();
    const orderId = orderData.data.order.id;
    console.log(`✓ Order created: ${orderId}`);
    console.log(`  Status: ${orderData.data.order.status}`);
    console.log(`  Price: GH₵ ${orderData.data.order.pricePaid}\n`);

    // 5. Simulate payment webhook
    console.log("5. Simulating payment confirmation...");
    const webhookRes = await fetch(`${BASE_URL}/api/payments/webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: orderId,
        paymentReference: `PAY-${Date.now()}`,
        status: "success",
      }),
    });
    const webhookData = await webhookRes.json();
    console.log("✓ Payment confirmed!");
    console.log(`  Order Status: ${webhookData.data.order.status}`);
    console.log(`  Commission: GH₵ ${webhookData.data.order.commissionAmount}`);
    console.log(`  New Balance: GH₵ ${webhookData.data.wallet.balance}\n`);

    // 6. Check wallet after
    console.log("6. Checking updated wallet...");
    const walletAfterRes = await fetch(`${BASE_URL}/api/wallet`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const walletAfterData = await walletAfterRes.json();
    console.log(
      `✓ Current Balance: GH₵ ${walletAfterData.data.wallet.balance}`,
    );
    console.log(
      `  Total Earned: GH₵ ${walletAfterData.data.wallet.totalEarned}\n`,
    );

    // 7. Check transactions
    console.log("7. Checking wallet transactions...");
    const txRes = await fetch(`${BASE_URL}/api/wallet/transactions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const txData = await txRes.json();
    console.log(`✓ Total transactions: ${txData.data.transactions.length}`);
    if (txData.data.transactions.length > 0) {
      const lastTx = txData.data.transactions[0];
      console.log(`  Latest: ${lastTx.type} - GH₵ ${lastTx.amount}`);
      console.log(`  Description: ${lastTx.description}\n`);
    }

    console.log("=== TEST COMPLETED SUCCESSFULLY! ===");
  } catch (error) {
    console.error("Error:", error.message);
  }
}

// Run the test
testWalletSystem();
