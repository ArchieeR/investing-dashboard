import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Firebase modules before importing auth-service
vi.mock("firebase/auth", () => ({
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  updateProfile: vi.fn(),
  onAuthStateChanged: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn(() => ({
    withConverter: vi.fn(() => "mock-ref"),
  })),
  getDoc: vi.fn(() => ({ exists: () => true })),
  setDoc: vi.fn(),
  Timestamp: {
    fromDate: vi.fn((d: Date) => ({ toDate: () => d })),
  },
}));

vi.mock("@/lib/firebase/client", () => ({
  auth: {
    currentUser: null,
    signOut: vi.fn(),
  },
  db: {},
}));

vi.mock("@/lib/firebase/converters", () => ({
  userConverter: {},
}));

import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
} from "firebase/auth";
import { getDoc, setDoc } from "firebase/firestore";
import { auth } from "@/lib/firebase/client";

import {
  signInWithGoogle,
  signInWithEmail,
  signUp,
  signOut,
  onAuthStateChange,
  getCurrentUser,
  ensureUserProfile,
} from "./auth-service";

describe("Auth Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("signInWithGoogle", () => {
    it("calls signInWithPopup and ensures user profile", async () => {
      const mockUser = {
        uid: "user-1",
        email: "test@example.com",
        displayName: "Test",
        photoURL: null,
      };
      vi.mocked(signInWithPopup).mockResolvedValueOnce({
        user: mockUser,
      } as never);
      vi.mocked(getDoc).mockResolvedValueOnce({ exists: () => true } as never);

      const user = await signInWithGoogle();
      expect(user.uid).toBe("user-1");
      expect(signInWithPopup).toHaveBeenCalled();
    });
  });

  describe("signInWithEmail", () => {
    it("calls signInWithEmailAndPassword", async () => {
      const mockUser = { uid: "user-1" };
      vi.mocked(signInWithEmailAndPassword).mockResolvedValueOnce({
        user: mockUser,
      } as never);

      const user = await signInWithEmail("test@example.com", "password");
      expect(user.uid).toBe("user-1");
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        "test@example.com",
        "password"
      );
    });
  });

  describe("signUp", () => {
    it("creates account, updates profile, and creates user doc", async () => {
      const mockUser = {
        uid: "user-1",
        email: "new@example.com",
        displayName: null,
        photoURL: null,
      };
      vi.mocked(createUserWithEmailAndPassword).mockResolvedValueOnce({
        user: mockUser,
      } as never);
      vi.mocked(updateProfile).mockResolvedValueOnce(undefined);
      vi.mocked(getDoc).mockResolvedValueOnce({ exists: () => false } as never);

      const user = await signUp("new@example.com", "password", "New User");
      expect(user.uid).toBe("user-1");
      expect(updateProfile).toHaveBeenCalledWith(mockUser, {
        displayName: "New User",
      });
      expect(setDoc).toHaveBeenCalled();
    });
  });

  describe("signOut", () => {
    it("calls auth.signOut()", async () => {
      vi.mocked(auth.signOut).mockResolvedValueOnce(undefined as never);
      await signOut();
      expect(auth.signOut).toHaveBeenCalled();
    });
  });

  describe("onAuthStateChange", () => {
    it("registers auth state listener", () => {
      const callback = vi.fn();
      const mockUnsubscribe = vi.fn();
      vi.mocked(onAuthStateChanged).mockReturnValueOnce(mockUnsubscribe);

      const unsub = onAuthStateChange(callback);
      expect(onAuthStateChanged).toHaveBeenCalled();
      expect(unsub).toBe(mockUnsubscribe);
    });
  });

  describe("getCurrentUser", () => {
    it("returns auth.currentUser", () => {
      const user = getCurrentUser();
      expect(user).toBeNull();
    });
  });

  describe("ensureUserProfile", () => {
    it("creates profile when user doc does not exist", async () => {
      vi.mocked(getDoc).mockResolvedValueOnce({ exists: () => false } as never);

      await ensureUserProfile({
        uid: "new-user",
        email: "new@example.com",
        displayName: "New",
        photoURL: null,
      } as never);

      expect(setDoc).toHaveBeenCalled();
    });

    it("skips creation when user doc already exists", async () => {
      vi.mocked(getDoc).mockResolvedValueOnce({ exists: () => true } as never);

      await ensureUserProfile({
        uid: "existing-user",
        email: "existing@example.com",
        displayName: "Existing",
        photoURL: null,
      } as never);

      expect(setDoc).not.toHaveBeenCalled();
    });
  });
});
