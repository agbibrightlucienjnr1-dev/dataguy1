require("dotenv").config();
const axios = require("axios");

const HUBNET_BASE_URL =
  "https://console.hubnet.app/live/api/context/business/transaction";

const headers = {
  token: `Bearer ${process.env.HUBNET_API_KEY}`,
  "Content-Type": "application/json",
};

async function checkBalance() {
  try {
    const response = await axios.get(`${HUBNET_BASE_URL}/check_balance`, {
      headers,
    });

    console.log("BALANCE RESPONSE:");
    console.log(response.data);
  } catch (error) {
    console.error("BALANCE ERROR:");
    console.error(error.response?.data || error.message);
  }
}

async function buyData() {
  try {
    const payload = {
      phone: "0598767501", // test number
      volume: "1000", // 1GB (based on sample)
      reference: `TEST-${Date.now()}`,
    };

    const response = await axios.post(
      `${HUBNET_BASE_URL}/mtn-new-transaction`,
      payload,
      { headers },
    );

    console.log("TRANSACTION RESPONSE:");
    console.log(response.data);
  } catch (error) {
    console.error("TRANSACTION ERROR:");
    console.error(error.response?.data || error.message);
  }
}

(async () => {
  console.log("=== CHECKING BALANCE ===");
  await checkBalance();

  console.log("\n=== TRYING DATA PURCHASE ===");
  await buyData();
})();
