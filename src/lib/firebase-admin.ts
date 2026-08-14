import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

function getAdminApp(): App {
  // Reuse existing Firebase Admin app
  const existingApp = getApps()[0];

  if (existingApp) {
    return existingApp;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  // ---------------------------------------------------------
  // 1. Preferred method: Separate Vercel environment variables
  // ---------------------------------------------------------
  if (projectId && clientEmail && privateKey) {
    try {
      return initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, "\n"),
        }),
      });
    } catch (error) {
      console.error(
        "[Firebase Admin] Failed to initialize using environment variables:",
        error
      );

      throw new Error(
        "Firebase Admin initialization failed. Please check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY."
      );
    }
  }

  // ---------------------------------------------------------
  // 2. Optional legacy support:
  // FIREBASE_SERVICE_ACCOUNT_KEY as a JSON string
  // ---------------------------------------------------------
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (serviceAccountKey) {
    try {
      const serviceAccount = JSON.parse(serviceAccountKey);

      if (
        serviceAccount.project_id &&
        serviceAccount.client_email &&
        serviceAccount.private_key
      ) {
        return initializeApp({
          credential: cert({
            projectId: serviceAccount.project_id,
            clientEmail: serviceAccount.client_email,
            privateKey: serviceAccount.private_key.replace(/\\n/g, "\n"),
          }),
        });
      }
    } catch (error) {
      console.error(
        "[Firebase Admin] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:",
        error
      );
    }
  }

  // ---------------------------------------------------------
  // 3. Build-safe fallback
  // ---------------------------------------------------------
  console.warn(
    "[Firebase Admin] Firebase Admin credentials are not available during build. Using build-time placeholder."
  );

  return initializeApp({
    projectId:
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
      "build-time-placeholder",
  });
}

const adminApp = getAdminApp();

export const adminAuth: Auth = getAuth(adminApp);
export const adminDb: Firestore = getFirestore(adminApp);

export default adminApp;