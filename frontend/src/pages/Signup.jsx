import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Hexagon, AlertCircle, CheckCircle2 } from "lucide-react";
import AuthLayout from "../layouts/AuthLayout";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Card from "../components/ui/Card";

export default function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });
    if (password !== confirm) {
      setMessage({ text: "Passwords do not match", type: "error" });
      return;
    }
    if (password.length < 6) {
      setMessage({ text: "Password must be at least 6 characters", type: "error" });
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("${import.meta.env.VITE_API_URL}/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage({ text: "Account created! Redirecting to login…", type: "success" });
        setTimeout(() => navigate("/login"), 1800);
      } else {
        setMessage({ text: data.message || "Registration failed", type: "error" });
      }
    } catch {
      setMessage({ text: "Server error. Please check your connection.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const pwStrength = () => {
    if (!password) return null;
    if (password.length < 6) return { label: "Too short", color: "text-danger", width: "25%" };
    if (password.length < 8) return { label: "Weak", color: "text-warning", width: "50%" };
    if (password.length < 12) return { label: "Good", color: "text-secondary", width: "75%" };
    return { label: "Strong", color: "text-primary", width: "100%" };
  };
  const strength = pwStrength();

  return (
    <AuthLayout>
      <Card className="w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-3 mb-8"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Hexagon className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl font-bold text-text-primary font-display">Collab</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold text-text-primary font-display mb-2">Create account</h1>
          <p className="text-text-secondary">Get started for free today</p>
        </motion.div>

        {message.text && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
              message.type === "error"
                ? "bg-danger/10 border border-danger/30 text-danger"
                : "bg-secondary/10 border border-secondary/30 text-secondary"
            }`}
          >
            {message.type === "error" ? (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            )}
            <span className="text-sm">{message.text}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Input
              type="text"
              label="Full Name"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
          >
            <Input
              type="email"
              label="Email Address"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Input
              type="password"
              label="Password"
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              showPasswordToggle
              required
            />
            {strength && (
              <div className="flex items-center gap-3 mt-2">
                <div className="flex-1 h-1 bg-surface rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: strength.width }}
                    transition={{ duration: 0.3 }}
                    className={`h-full ${strength.color.replace('text-', 'bg-')}`}
                  />
                </div>
                <span className={`text-xs font-semibold ${strength.color}`}>{strength.label}</span>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.35 }}
          >
            <Input
              type="password"
              label="Confirm Password"
              placeholder="Repeat password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              error={confirm && password && password !== confirm ? "Passwords do not match" : ""}
              required
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <Button type="submit" loading={loading} className="w-full">
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </motion.div>
        </form>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="text-center text-sm text-text-secondary mt-6"
        >
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-semibold hover:text-primary-hover transition-colors">
            Sign in
          </Link>
        </motion.p>
      </Card>
    </AuthLayout>
  );
}
