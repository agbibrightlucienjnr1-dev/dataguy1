import { initDatabase, closeDatabase } from "../src/config/database.js";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const prisma = await initDatabase();
  console.log("Fetching all users to reassign agentCodes...");

  // 1. Fetch all users ordered by their current agentCode (ascending)
  const users = await prisma.user.findMany({
    orderBy: { agentCode: "asc" },
  });

  console.log(`Found ${users.length} users.`);

  if (users.length === 0) {
    console.log("No users to update.");
    return;
  }

  // 2. Pre-update all users to a temporary high code to avoid UNIQUE constraint collisions
  // We'll use id-based logic or simply high numbers + index
  console.log("Moving users to temporary high agentCodes to avoid UNIQUE collisions...");
  for (let i = 0; i < users.length; i++) {
    const tempCode = 1000000 + i; 
    await prisma.user.update({
      where: { id: users[i].id },
      data: { agentCode: tempCode },
    });
  }

  // 3. Calculate new multiple of 3 or 4 sequences and update them
  console.log("Assigning new codes (multiples of 3 and 4)...");
  let nextValidCode = 0;
  
  for (let i = 0; i < users.length; i++) {
    // Find the next available valid code
    nextValidCode++;
    while (nextValidCode % 3 !== 0 && nextValidCode % 4 !== 0) {
      nextValidCode++;
    }

    await prisma.user.update({
      where: { id: users[i].id },
      data: { agentCode: nextValidCode },
    });
    
    console.log(`User ${users[i].email} -> old: ${users[i].agentCode}, new: ${nextValidCode}`);
  }

  console.log("Successfully reassigned all agent codes.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await closeDatabase();
  });
