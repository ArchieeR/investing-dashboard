import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  type User,
  type Unsubscribe,
} from "firebase/auth";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { userConverter, type UserDoc } from "@/lib/firebase/converters";

const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  await ensureUserProfile(result.user);
  return result.user;
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function signUp(
  email: string,
  password: string,
  displayName: string
): Promise<User> {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(result.user, { displayName });
  await ensureUserProfile(result.user);
  return result.user;
}

export async function signOut(): Promise<void> {
  await auth.signOut();
}

export function onAuthStateChange(
  callback: (user: User | null) => void
): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}

export function getCurrentUser(): User | null {
  return auth.currentUser;
}

export async function ensureUserProfile(user: User): Promise<void> {
  const userRef = doc(db, "users", user.uid).withConverter(userConverter);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    const now = new Date();
    const newUser: UserDoc = {
      uid: user.uid,
      email: user.email ?? "",
      displayName: user.displayName ?? "",
      photoURL: user.photoURL ?? null,
      plan: "free",
      stripeCustomerId: null,
      createdAt: now,
      updatedAt: now,
      preferences: {
        currency: "GBP",
        theme: "dark",
        notifications: true,
      },
    };
    await setDoc(userRef, newUser);
  }
}
