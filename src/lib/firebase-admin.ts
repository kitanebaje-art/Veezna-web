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

  let serviceAccount: {
    project_id?: string;
    client_email?: string;
    private_key?: string;
  } = {};

  // 1. Check Environment Variable
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    } catch (error) {
      console.error("[Firebase Admin] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY JSON string.", error);
    }
  }

  // 2. Check local file if available
  if (!serviceAccount.project_id) {
    const serviceAccountPath = path.join(process.cwd(), "firebase-service-account.json");

    if (fs.existsSync(serviceAccountPath)) {
      try {
        const fileContent = fs.readFileSync(serviceAccountPath, "utf8");
        serviceAccount = JSON.parse(fileContent);
      } catch (error) {
        console.error("[Firebase Admin] Failed to read local service account JSON.", error);
      }
    }
  }

  // 3. Safe Fallback for Vercel Static Build (Crucial: prevents build crash)
  if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
    console.warn("[Firebase Admin] No valid credentials found. Initializing fallback mock app for build time.");
    return initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "build-time-placeholder",
    });
  }

  const privateKey = serviceAccount.private_key.replace(/\\n/g, "\n");

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