const { admin } = require("../src/config/firebase"); 

async function main() {
  const auth = admin.auth();

  const targetUid = "vosdUPlTsgS120DmHjnvglQbCov1";
  

  await auth.setCustomUserClaims(targetUid, {
    companyId: "ufDvmtCopWqH9oXle8e2",
    role: "owner",
  });

  console.log("Custom claims set for user:", targetUid);

  process.exit(0);
}

main().catch((error: any) => {
  console.error("Error setting custom claims:", error);
  process.exit(1);
});