import dotenv from "dotenv";
// Load env variables
dotenv.config();

import { initDatabase, getPrisma } from "./config/database.js";
import { createWithdrawalRequest, approveWithdrawal, completeWithdrawalManually } from "./services/withdrawalService.js";
import assert from "assert";

async function runTest() {
  await initDatabase();
  const prisma = getPrisma();

  console.log("Database initialized. Finding a test user...");

  // Find any agent or subagent user
  let user = await prisma.user.findFirst({
    where: { role: { in: ["agent", "sub_agent"] } },
    include: { wallet: true }
  });

  if (!user) {
    console.log("No agent or subagent user found, checking any user...");
    user = await prisma.user.findFirst({
      include: { wallet: true }
    });
  }

  if (!user) {
    console.error("No user found in database. Please run seedAdmin.js or create a user first.");
    process.exit(1);
  }

  console.log(`Using user: ${user.name} (${user.role}) - Wallet ID: ${user.wallet?.id}`);

  // Ensure user has wallet and a balance of at least 100 GHS
  if (!user.wallet) {
    console.log("User has no wallet, creating one...");
    user.wallet = await prisma.wallet.create({
      data: {
        userId: user.id,
        balance: 100.00
      }
    });
  } else if (parseFloat(user.wallet.balance) < 100) {
    console.log(`User balance is ${user.wallet.balance}, updating balance to 100 GHS...`);
    user.wallet = await prisma.wallet.update({
      where: { id: user.wallet.id },
      data: { balance: 100.00 }
    });
  }

  const initialBalance = parseFloat(user.wallet.balance);
  console.log(`Initial balance: GHS ${initialBalance}`);

  const withdrawalAmount = 25.00;

  console.log(`Step 1: Creating withdrawal request for GHS ${withdrawalAmount}...`);
  const withdrawal = await createWithdrawalRequest(user.id, {
    amount: withdrawalAmount,
    accountNumber: "0241234567",
    accountName: "Test Account Name",
    mobileNetwork: "MTN"
  });

  console.log(`Withdrawal created. ID: ${withdrawal.id}, Status: ${withdrawal.status}, Ref: ${withdrawal.reference}`);
  assert.strictEqual(withdrawal.status, "pending", "Withdrawal status must be 'pending' initially");

  // Re-fetch user wallet to verify balance HAS NOT changed yet
  let updatedWallet = await prisma.wallet.findUnique({
    where: { userId: user.id }
  });
  console.log(`Wallet balance after creation: GHS ${updatedWallet.balance}`);
  assert.strictEqual(parseFloat(updatedWallet.balance), initialBalance, "Wallet balance should NOT be debited on creation");

  console.log("Step 2: Approving withdrawal request (manual mode)...");
  // Find an admin user to act as approver
  let admin = await prisma.user.findFirst({
    where: { role: "admin" }
  });
  if (!admin) {
    admin = user; // Fallback if no admin is seeded yet
  }

  const approved = await approveWithdrawal(withdrawal.id, admin.id, true);
  console.log(`Withdrawal approved. Status: ${approved.status}, Note: ${approved.adminNote}`);
  assert.strictEqual(approved.status, "processing", "Approved manual withdrawal status should transition to 'processing'");

  // Re-fetch user wallet to verify balance HAS been debited
  updatedWallet = await prisma.wallet.findUnique({
    where: { userId: user.id }
  });
  console.log(`Wallet balance after approval: GHS ${updatedWallet.balance}`);
  assert.strictEqual(parseFloat(updatedWallet.balance), initialBalance - withdrawalAmount, "Wallet balance should be debited by the withdrawal amount upon approval");

  console.log("Step 3: Completing withdrawal manually...");
  const completed = await completeWithdrawalManually(withdrawal.id, admin.id, "Test external manual transfer complete");
  console.log(`Withdrawal completed. Status: ${completed.status}, Note: ${completed.adminNote}`);
  assert.strictEqual(completed.status, "completed", "Completed withdrawal status should transition to 'completed'");

  // Clean up: delete the test withdrawal request
  await prisma.withdrawal.delete({
    where: { id: withdrawal.id }
  });
  // Restore initial wallet balance
  await prisma.wallet.update({
    where: { id: user.wallet.id },
    data: { balance: initialBalance }
  });

  console.log("✓ Test passed: Manual withdrawal request creation, wallet balance behavior, approval debiting, and completion workflow are correct!");
  process.exit(0);
}

runTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
