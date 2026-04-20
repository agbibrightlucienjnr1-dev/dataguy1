import dotenv from "dotenv";
dotenv.config();

const testPaystackCharge = async () => {
  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
  if (!PAYSTACK_SECRET_KEY) {
    console.error("No PAYSTACK_SECRET_KEY found.");
    return;
  }

  const payload = {
    email: "test0241234567@customer.dataguy.com",
    amount: 100, // 1 GHS in pesewas
    currency: "GHS",
    reference: `test_${Date.now()}`,
    mobile_money: {
      phone: "0551234567", // Valid MTN number format
      provider: "mtn"
    }
  };

  try {
    const response = await fetch("https://api.paystack.co/charge", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log("Status Code:", response.status);
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error:", error);
  }
};

testPaystackCharge();
