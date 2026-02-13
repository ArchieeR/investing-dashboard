import { initializeApp, getApps, getApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// Service Account should be passed as a stringified JSON in env vars for production
// Or specific fields for development. Using a generic approach here.

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    : undefined;

// Ideally, in Vercel/Cloud Run, we rely on Application Default Credentials (ADC) if no key is provided.
// But for "firebase-admin", specific init is often needed if outside GCP context or checking local dev.

if (getApps().length === 0) {
    initializeApp({
        credential: serviceAccount ? cert(serviceAccount) : undefined,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
}

const adminDb = getFirestore();
const adminAuth = getAuth();

export { adminDb, adminAuth };
