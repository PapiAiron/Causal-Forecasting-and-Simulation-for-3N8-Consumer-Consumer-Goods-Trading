import { useState } from "react";
import { useTheme } from "../components/ThemeContext";
import { auth, db } from "../firebase";
import { Eye, EyeOff } from "lucide-react";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

const SignUp = ({ onNavigate }) => {
  const { theme } = useTheme();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState("");

  const getErrorMessage = (code) => {
    switch (code) {
      case "auth/email-already-in-use":
        return "This email is already registered.";
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/weak-password":
        return "Password should be at least 6 characters.";
      case "auth/operation-not-allowed":
        return "Email/password accounts are not enabled.";
      case "auth/network-request-failed":
        return "Network error. Please check your connection.";
      default:
        return "Something went wrong. Please try again.";
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateName = (name) => {
    const nameRegex = /^[a-zA-Z\s]{2,50}$/;
    return nameRegex.test(name.trim());
  };

  const checkPasswordStrength = (password) => {
    let strength = 0;
    let feedback = "";

    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 1) {
      feedback = "Weak";
    } else if (strength <= 3) {
      feedback = "Medium";
    } else {
      feedback = "Strong";
    }

    return { strength, feedback };
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
    const { feedback } = checkPasswordStrength(value);
    setPasswordStrength(feedback);
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case "Weak":
        return "text-red-500";
      case "Medium":
        return "text-orange-500";
      case "Strong":
        return "text-green-500";
      default:
        return "";
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate name
    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!validateName(name)) {
      setError("Name should only contain letters and spaces (2-50 characters).");
      return;
    }

    // Validate email
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    // Validate password
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password.length < 8) {
      setError("For better security, use at least 8 characters.");
      return;
    }

    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password)) {
      setError("Password should contain both uppercase and lowercase letters.");
      return;
    }

    if (!/\d/.test(password)) {
      setError("Password should contain at least one number.");
      return;
    }

    // Check password match
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // Check for common passwords
    const commonPasswords = ["password", "123456", "qwerty", "abc123", "password123"];
    if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
      setError("Please choose a more secure password.");
      return;
    }

    try {
      setLoading(true);

      // After createUserWithEmailAndPassword
      const { user } = await createUserWithEmailAndPassword(auth, email, password);

      // Add display name to Firebase Auth
      await updateProfile(user, { displayName: name.trim() });

      // Send verification email BEFORE sign out
      await sendEmailVerification(user, {
        url: window.location.origin + "/login",
        handleCodeInApp: true,
      });

      // Save user profile in Firestore
      await setDoc(doc(db, "users", user.uid), {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        createdAt: serverTimestamp(),
        emailVerified: false,
        role: "user",
        loginCount: 0,
        accountStatus: "active",
        profile: {
          displayName: name.trim(),
          photoURL: null,
        },
        security: {
          passwordChangedAt: serverTimestamp(),
          lastPasswordReset: null,
        },
      });

      // ✅ Now sign out AFTER sending verification
      await auth.signOut();


      setSuccess(
        "Account created successfully! Please check your email to verify your account before logging in."
      );
      
      // Clear form
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setPasswordStrength("");

      // Redirect to login after 3 seconds
      setTimeout(() => {
        onNavigate("login");
      }, 1000);

    } catch (err) {
      console.error("Signup error:", err);
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-8">
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
          Create an Account
        </h2>

        {error && (
          <div className="text-red-500 text-sm mb-3 font-medium bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
            {error}
          </div>
        )}
        
        {success && (
          <div className="text-green-600 text-sm mb-3 font-medium bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
            {success}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-5">
          <div>
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
              maxLength={50}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-opacity-50 dark:bg-gray-700 dark:text-white disabled:opacity-50"
              style={{ focusRingColor: theme.chart }}
            />
          </div>

          <div>
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
          </div>

          <div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Create Password"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                required
                minLength={6}
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-opacity-50 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                style={{ focusRingColor: theme.chart }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                disabled={loading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {password && (
              <p className={`text-xs mt-1 ${getPasswordStrengthColor()}`}>
                Password Strength: {passwordStrength}
              </p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Use 8+ characters with uppercase, lowercase, and numbers
            </p>
          </div>

          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-opacity-50 dark:bg-gray-700 dark:text-white disabled:opacity-50"
              style={{ focusRingColor: theme.chart }}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              disabled={loading}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full text-white py-2 rounded-lg shadow-md hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: theme.chart }}
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
          Already have an account?{" "}
          <button
            onClick={() => onNavigate("login")}
            className="hover:underline font-medium"
            style={{ color: theme.chart }}
          >
            Login
          </button>
        </p>

        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default SignUp;