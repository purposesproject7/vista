// src/features/auth/pages/BlockedPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldExclamationIcon,
  ClockIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import Button from "../../../shared/components/Button";
import Card from "../../../shared/components/Card";

const BlockedPage = () => {
  const navigate = useNavigate();

  // Initialize blockInfo from localStorage
  const getInitialBlockInfo = () => {
    const storedBlock = localStorage.getItem("broadcastBlock");
    if (!storedBlock) return null;

    try {
      return JSON.parse(storedBlock);
    } catch (error) {
      console.error("Error parsing block info:", error);
      return null;
    }
  };

  const [blockInfo] = useState(getInitialBlockInfo);
  const [timeRemaining, setTimeRemaining] = useState("");

  useEffect(() => {
    if (!blockInfo?.expiresAt) return;

    const updateTimeRemaining = () => {
      const now = new Date();
      const expiresAt = new Date(blockInfo.expiresAt);
      const diff = expiresAt - now;

      if (diff <= 0) {
        setTimeRemaining("Block has expired");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m remaining`);
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s remaining`);
      } else {
        setTimeRemaining(`${seconds}s remaining`);
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [blockInfo]);

  const handleRetry = () => {
    // Clear the block info
    localStorage.removeItem("broadcastBlock");
    // Redirect to login to start fresh
    navigate("/login");
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("broadcastBlock");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-2xl">
        <div className="text-center">
          {/* Icon */}
          <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <ShieldExclamationIcon className="w-12 h-12 text-red-600" />
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            {blockInfo?.title || "Access Temporarily Blocked"}
          </h1>

          {/* Message */}
          <div className="mb-6">
            <p className="text-lg text-gray-700 leading-relaxed">
              {blockInfo?.message ||
                "Access to the system has been temporarily blocked by the administrator."}
            </p>
          </div>

          {/* Time Remaining */}
          {blockInfo?.expiresAt && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center gap-2 text-orange-800">
                <ClockIcon className="w-5 h-5" />
                <span className="font-semibold">{timeRemaining}</span>
              </div>
              <p className="text-sm text-orange-700 mt-2">
                Access will be restored after this time
              </p>
            </div>
          )}

          {/* Information Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-blue-900 mb-2">
              What does this mean?
            </h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>The administrator has temporarily blocked system access</li>
              <li>
                This may be due to maintenance, updates, or other administrative
                reasons
              </li>
              <li>Your account is safe and no action is required from you</li>
              <li>
                You can try again after the block expires or contact your
                administrator
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={handleRetry}
              variant="primary"
              className="w-full flex items-center justify-center gap-2"
            >
              <ArrowPathIcon className="w-5 h-5" />
              Try Again
            </Button>

            <Button
              onClick={handleLogout}
              variant="secondary"
              className="w-full"
            >
              Logout and Return to Login
            </Button>
          </div>

          {/* Footer Note */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              If you believe this is an error or need immediate access, please
              contact your system administrator.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BlockedPage;
