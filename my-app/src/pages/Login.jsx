import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { useTheme } from "../components/ThemeContext";
import { Eye, EyeOff } from "lucide-react";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
} from "firebase/auth";
import { doc, updateDoc, serverTimestamp, getDoc } from "firebase/firestore";

const Login = ({ onNavigate }) => {
  const { theme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resetMode, setResetMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // Check for lockout on component mount
  useEffect(() => {
    const storedLockout = localStorage.getItem("loginLockout");
    if (storedLockout) {
      const lockoutEnd = parseInt(storedLockout);
      if (Date.now() < lockoutEnd) {
        setLockoutTime(lockoutEnd);
      } else {
        localStorage.removeItem("loginLockout");
        setAttempts(0);
      }
    }
  }, []);

  // Countdown timer for lockout
  useEffect(() => {
    if (lockoutTime) {
      const interval = setInterval(() => {
        if (Date.now() >= lockoutTime) {
          setLockoutTime(null);
          setAttempts(0);
          localStorage.removeItem("loginLockout");
          setError("");
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lockoutTime]);

  const getErrorMessage = (code) => {
    switch (code) {
      case "auth/invalid-email":
        return "Invalid email format.";
      case "auth/user-disabled":
        return "This account has been disabled. Contact support.";
      case "auth/user-not-found":
        return "No account found with this email.";
      case "auth/wrong-password":
        return "Incorrect password.";
      case "auth/invalid-credential":
        return "Invalid email or password.";
      case "auth/too-many-requests":
        return "Too many attempts. Please try again later.";
      case "auth/network-request-failed":
        return "Network error. Please check your connection.";
      default:
        return "Login failed. Please try again.";
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Check if locked out
    if (lockoutTime && Date.now() < lockoutTime) {
      const remainingTime = Math.ceil((lockoutTime - Date.now()) / 1000);
      setError(`Too many failed attempts. Please wait ${remainingTime} seconds.`);
      return;
    }

    // Validate inputs
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!validatePassword(password)) {
      setError("Password must be at least 6 characters.");
      return;
    }

    // Check attempt limit
    if (attempts >= 5) {
      const lockoutEnd = Date.now() + 300000; // 5 minutes lockout
      setLockoutTime(lockoutEnd);
      localStorage.setItem("loginLockout", lockoutEnd.toString());
      setError("Too many failed attempts. Account locked for 5 minutes.");
      return;
    }

    try {
      setLoading(true);
      const { user } = await signInWithEmailAndPassword(auth, email, password);

      // Check email verification
      if (!user.emailVerified) {
        setError("Please verify your email before logging in.");
        setLoading(false);
        return;
      }

      // Update last login timestamp in Firestore
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        await updateDoc(userRef, {
          lastLoginAt: serverTimestamp(),
          loginCount: (userDoc.data().loginCount || 0) + 1,
        });
      } else {
        // Create user document if it doesn't exist
        await updateDoc(userRef, {
        email: user.email,
        displayName: user.displayName || "",
        lastLoginAt: serverTimestamp(),
        loginCount: 1,
        emailVerified: true,
      });

      }

      // Reset attempts on successful login
      setAttempts(0);
      localStorage.removeItem("loginLockout");
      
      setSuccess("Login successful!");
      setTimeout(() => onNavigate("home"), 1000);
    } catch (err) {
      console.error("Login error:", err);
      setError(getErrorMessage(err.code));
      setAttempts((prev) => prev + 1);
      
      // Store attempts in localStorage for persistence
      localStorage.setItem("loginAttempts", (attempts + 1).toString());
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email) {
      setError("Please enter your email to reset password.");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, email, {
        url: window.location.origin + "/login",
        handleCodeInApp: false,
      });
      setSuccess("Password reset email sent! Check your inbox and spam folder.");
    } catch (err) {
      console.error("Reset error:", err);
      if (err.code === "auth/user-not-found") {
        setError("No account found with this email.");
      } else {
        setError(getErrorMessage(err.code));
      }
    } finally {
      setLoading(false);
    }
  };

  const resendVerificationEmail = async () => {
    if (!email) {
      setError("Please enter your email first.");
      return;
    }

    try {
      setLoading(true);
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      
      if (user.emailVerified) {
        setError("Email is already verified. Please try logging in.");
        return;
      }

      await sendEmailVerification(user, {
        url: window.location.origin + "/login",
        handleCodeInApp: true,
      });
      
      await auth.signOut();
      setSuccess("Verification email sent! Check your inbox.");
    } catch (err) {
      console.error("Resend verification error:", err);
      setError("Failed to resend verification email.");
    } finally {
      setLoading(false);
    }
  };

  const getRemainingTime = () => {
    if (!lockoutTime) return "";
    const remaining = Math.ceil((lockoutTime - Date.now()) / 1000);
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-8">
        {/* Logo at the top */}
        <div className="flex justify-center mb-6">
          <img 
            src="/3N8.png" 
            alt="3N8 Logo" 
            className="h-16 w-auto object-contain"
          />
        </div>
        <h2 className="text-2xl font-semibold text-center text-gray-800 dark:text-white mb-6">
          {resetMode ? "Reset Password" : "Welcome Back"}
        </h2>

        {error && (
          <div className="text-red-500 text-sm mb-3 font-medium bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
            {error}
            {error.includes("verify your email") && (
              <button
                onClick={resendVerificationEmail}
                className="block mt-2 underline hover:no-underline"
              >
                Resend verification email
              </button>
            )}
          </div>
        )}
        
        {success && (
          <div className="text-green-600 text-sm mb-3 font-medium bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
            {success}
          </div>
        )}

        {lockoutTime && (
          <div className="text-orange-600 text-sm mb-3 font-medium bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg text-center">
            Account locked. Try again in: {getRemainingTime()}
          </div>
        )}

        {!resetMode ? (
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value.trim())}
                required
                disabled={loading || lockoutTime}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-opacity-50 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ focusRingColor: theme.chart }}
              />
            </div>
            
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading || lockoutTime}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-opacity-50 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ focusRingColor: theme.chart }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                disabled={loading || lockoutTime}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {attempts > 0 && !lockoutTime && (
              <p className="text-xs text-orange-600 dark:text-orange-400">
                Failed attempts: {attempts}/5
              </p>
            )}

            <button
              type="submit"
              disabled={loading || lockoutTime}
              className="w-full text-white py-2 rounded-lg shadow-md hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: theme.chart }}
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>
        ) : (
          <form onSubmit={handlePasswordReset} className="space-y-5">
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value.trim())}
              required
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-opacity-50 dark:bg-gray-700 dark:text-white disabled:opacity-50"
              style={{ focusRingColor: theme.chart }}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full text-white py-2 rounded-lg shadow-md hover:opacity-90 transition disabled:opacity-50"
              style={{ backgroundColor: theme.chart }}
            >
              {loading ? "Sending..." : "Send Reset Email"}
            </button>
          </form>
        )}

        <div className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
          {!resetMode ? (
            <>
              <button
                onClick={() => {
                  setResetMode(true);
                  setError("");
                  setSuccess("");
                }}
                className="hover:underline block mb-3"
                style={{ color: theme.chart }}
              >
                Forgot Password?
              </button>
              Don't have an account?{" "}
              <button
                onClick={() => onNavigate("signup")}
                className="hover:underline font-medium"
                style={{ color: theme.chart }}
              >
                Sign Up
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setResetMode(false);
                setError("");
                setSuccess("");
              }}
              className="hover:underline"
              style={{ color: theme.chart }}
            >
              Back to Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;