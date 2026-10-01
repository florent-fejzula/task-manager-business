// ForgotPassword.js
import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { Link } from "react-router-dom";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleReset = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset email sent! Check your inbox.");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-sm mx-auto py-4 sm:py-10">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 text-center">Reset Password</h2>
      <form onSubmit={handleReset} className="space-y-3">
        {message && <p className="text-green-600 text-sm">{message}</p>}
        {error && <p className="text-red-500 text-sm">{error}</p>}

        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border px-3 py-2 rounded-md"
          required
        />
        <button
          type="submit"
          className="w-full bg-accent text-white py-2 rounded-md"
        >
          Send Reset Email
        </button>
      </form>

      <p className="text-center text-sm mt-4">
        <Link to="/login" className="text-accent underline">
          ← Back to Login
        </Link>
      </p>
    </div>
  );
}

export default ForgotPassword;
