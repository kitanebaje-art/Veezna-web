import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

function getAdminApp(): App {
  const existingApp = getApps()[0];

  if (existingApp) {
    return existingApp;
  }

  const serviceAccountPath = path.join(
    process.cwd(),
    "firebase-service-account.json"
  );

  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error(
      "Firebase Admin configuration error: firebase-service-account.json was not found in the project root."
    );
  }

  let serviceAccount: {
    project_id: string;
    client_email: string;
    private_key: string;
  };

  try {
    const fileContent = fs.readFileSync(serviceAccountPath, "utf8");

    serviceAccount = JSON.parse(fileContent);
  } catch (error) {
    console.error("[Firebase Admin] Failed to read service account JSON.");

    throw new Error(
      "Firebase Admin configuration error: Invalid firebase-service-account.json."
    );
  }

  if (!serviceAccount.project_id) {
    throw new Error(
      "Firebase Admin configuration error: project_id is missing."
    );
  }

  if (!serviceAccount.client_email) {
    throw new Error(
      "Firebase Admin configuration error: client_email is missing."
    );
  }

  if (!serviceAccount.private_key) {
    throw new Error(
      "Firebase Admin configuration error: private_key is missing."
    );
  }

  const privateKey = serviceAccount.private_key.replace(/\\n/g, "\n");

  if (
    !privateKey.includes("-----BEGIN PRIVATE KEY-----") ||
    !privateKey.includes("-----END PRIVATE KEY-----")
  ) {
    throw new Error(
      "Firebase Admin configuration error: Invalid private key format."
    );
  }

  console.log("[Firebase Admin] Initializing...");
  console.log(
    "[Firebase Admin] Project:",
    serviceAccount.project_id
  );
  console.log(
    "[Firebase Admin] Client:",
    serviceAccount.client_email
  );

  return initializeApp({
    credential: cert({
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey,
    }),
  });
}

const adminApp = getAdminApp();

export const adminAuth: Auth = getAuth(adminApp);

export const adminDb: Firestore = getFirestore(adminApp);