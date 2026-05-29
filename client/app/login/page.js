"use client";

import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function LoginPage() {
  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: "select_account"
      });

      const result = await signInWithPopup(auth, provider);

      console.log("USER:", result.user);

      alert(`Welcome ${result.user.displayName}`);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <button
        onClick={handleGoogleLogin}
        className="px-6 py-3 bg-black text-white rounded-xl"
      >
        Continue with Google
      </button>
    </div>
  );
}
