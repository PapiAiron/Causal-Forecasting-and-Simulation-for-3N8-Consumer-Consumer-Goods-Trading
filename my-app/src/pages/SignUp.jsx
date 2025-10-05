import { useState } from "react";
import { useTheme } from '../components/ThemeContext';

const SignUp = ({ onNavigate }) => {
  const { theme } = useTheme();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = (e) => {
    e.preventDefault();
    console.log("Signing up:", { name, email, password });
    // TODO: Add your sign-up logic here (Firebase/Auth backend)
    // After successful signup, navigate to home:
    onNavigate('home');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-8">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img 
            src="3N8.png" 
            alt="3N8 Logo" 
            className="w-20 h-20 object-contain rounded-full shadow-lg"
          />
        </div>

        <h2 className="text-2xl font-semibold text-center text-gray-800 dark:text-white mb-6">
          Create an Account
        </h2>

        <form onSubmit={handleSignup} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Full Name
            </label>
            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 outline-none"
              style={{ '--tw-ring-color': theme.chart + '40' }}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email Address
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 outline-none"
              style={{ '--tw-ring-color': theme.chart + '40' }}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
            <input
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 outline-none"
              style={{ '--tw-ring-color': theme.chart + '40' }}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full text-white py-2 rounded-lg hover:opacity-90 transition-all"
            style={{ backgroundColor: theme.chart }}
          >
            Sign Up
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
          Already have an account?{" "}
          <button 
            onClick={() => onNavigate('login')}
            className="hover:underline"
            style={{ color: theme.chart }}
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignUp;