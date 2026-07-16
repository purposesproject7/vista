import React, { useState } from "react";
import { EyeIcon, EyeSlashIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../shared/hooks/useAuth";
import Button from "../../../shared/components/Button";
import Input from "../../../shared/components/Input";
import Card from "../../../shared/components/Card";
import api from "../../../services/api";
import { useToast } from "../../../shared/hooks/useToast";
import PasswordCriteria, { validatePassword } from "../../../shared/components/PasswordCriteria";

/**
 * SetupPassword - Mandatory first-time password change page.
 * Shown to faculty accounts that still have isDefaultPassword === true.
 * After successful setup, navigates to the appropriate dashboard.
 */
const SetupPassword = ({ redirectTo: redirectToProp = "/faculty" }) => {
  const location = useLocation();
  const redirectTo = location.state?.redirectTo || redirectToProp;
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { user, setUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const getStrength = (pwd) => {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strengthLabel = (score) => {
    if (score === 0) return { label: "", color: "#d1d5db" };
    if (score <= 1) return { label: "Weak", color: "#ef4444" };
    if (score <= 2) return { label: "Fair", color: "#f97316" };
    if (score <= 3) return { label: "Good", color: "#eab308" };
    if (score <= 4) return { label: "Strong", color: "#22c55e" };
    return { label: "Very Strong", color: "#16a34a" };
  };

  const strength = getStrength(newPassword);
  const strengthInfo = strengthLabel(strength);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/auth/setup-password", {
        newPassword,
        confirmPassword,
      });

      if (response.data.success) {
        showToast("Password set up successfully! Welcome to VISTA.", "success");

        if (setUser) {
          setUser((prev) => ({ ...prev, isDefaultPassword: false }));
        }

        navigate(redirectTo || "/faculty", { replace: true });
      } else {
        setError(response.data.message || "Something went wrong.");
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to set up password. Please try again.";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-100 rounded-full mb-4">
            <ShieldCheckIcon className="w-7 h-7 text-blue-600" />
          </div>
          <div className="mb-2">
            <span className="vista-brand text-4xl font-bold text-blue-600">VISTA</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Set Your Password</h1>
          <p className="text-sm text-gray-600 leading-relaxed">
            Welcome, <span className="font-semibold text-blue-600">{user?.name || "Faculty"}</span>!
            Your account uses a temporary password. Create a new one to continue.
          </p>
        </div>

        <div className="mb-5 rounded-lg border border-blue-100 bg-blue-50 p-3">
          <p className="text-sm text-blue-700">
            This is a one-time setup step. Your new password must meet the security requirements below.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="New Password"
            type={showNew ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
            required
            endIcon={
              showNew ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )
            }
            onEndIconClick={() => setShowNew(!showNew)}
          />

          {newPassword && (
            <div>
              <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden mb-2">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${(strength / 5) * 100}%`,
                    backgroundColor: strengthInfo.color,
                  }}
                />
              </div>
              <p className="mt-1 text-xs font-medium mb-3" style={{ color: strengthInfo.color }}>
                {strengthInfo.label}
              </p>
              <PasswordCriteria password={newPassword} />
            </div>
          )}

          <Input
            label="Confirm Password"
            type={showConfirm ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter new password"
            required
            endIcon={
              showConfirm ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )
            }
            onEndIconClick={() => setShowConfirm(!showConfirm)}
          />

          {confirmPassword && confirmPassword !== newPassword && (
            <p className="text-sm text-red-600">Passwords do not match</p>
          )}
          {confirmPassword && confirmPassword === newPassword && (
            <p className="text-sm text-green-600">✓ Passwords match</p>
          )}

          <Button type="submit" variant="primary" className="w-full" disabled={loading}>
            {loading ? "Setting up..." : "Set New Password & Continue"}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default SetupPassword;
