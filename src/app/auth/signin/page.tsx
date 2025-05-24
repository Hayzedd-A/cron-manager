"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef } from "react";
import { toast, Toaster } from "react-hot-toast";
import { Eye, EyeOff, Loader2, Mail, Lock, ArrowRight, X } from "lucide-react";
import Link from "next/link";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [resetEmail, setResetEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");

  const modalRef = useRef<HTMLDivElement>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const loadingToast = toast.loading("Signing in...");

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      toast.dismiss(loadingToast);

      if (res?.error) {
        setError("Invalid credentials");
        toast.error("Invalid credentials");
      } else {
        toast.success("Login successful!");
        router.push(callbackUrl);
      }
    } catch (error) {
      console.log(error)
      toast.dismiss(loadingToast);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");
    setResetLoading(true);

    const loadingToast = toast.loading("Sending verification code...");

    try {
      // Implement your request password reset API call here
      const res = await fetch("/api/auth/forget-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });

      const data = await res.json();
      toast.dismiss(loadingToast);

      if (!res.ok) {
        setResetError(data?.error || "Failed to send verification code");
        toast.error(data?.error || "Failed to send verification code");
      } else {
        toast.success("Verification code sent to your email");
        setResetStep(2);
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error("Something went wrong. Please try again.");
      console.error("Error requesting password reset:", error);
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");
    setResetLoading(true);

    const loadingToast = toast.loading("Resetting password...");

    try {
      const res = await fetch("/api/auth/forget-password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: resetEmail,
          password: newPassword,
          otp: resetOtp,
        }),
      });

      const data = await res.json();
      toast.dismiss(loadingToast);

      if (!res.ok) {
        setResetError(data?.error || "Failed to reset password");
        toast.error(data?.error || "Failed to reset password");
      } else {
        toast.success(
          "Password reset successful! You can now login with your new password."
        );
        closeModal();
        // Pre-fill the email field for convenience
        setEmail(resetEmail);
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error("Something went wrong. Please try again.");
      console.error("Error resetting password:", error);
    } finally {
      setResetLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setResetStep(1);
    setResetEmail("");
    setResetOtp("");
    setNewPassword("");
    setResetError("");
  };

  // Close modal when clicking outside
  const handleModalClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      closeModal();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <Toaster position="top-right" />

      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Welcome Back
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/signup"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign up
            </Link>
          </p>
        </div>

        <form onSubmit={handleLogin} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email Address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  className="pl-10 block w-full pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="pl-10 block w-full pr-10 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-500 focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex justify-end mt-1">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  Forgot password?
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Forgot Password Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handleModalClick}
        >
          <div
            ref={modalRef}
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative"
          >
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Reset Password
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {resetStep === 1
                  ? "Enter your email to receive a verification code"
                  : "Enter the verification code and your new password"}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="relative mb-8">
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                <div
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-500"
                  style={{ width: resetStep === 1 ? "50%" : "100%" }}
                ></div>
              </div>
              <div className="flex justify-between">
                <div className="text-xs font-medium text-blue-600">
                  Step 1: Verify Email
                </div>
                <div
                  className={`text-xs font-medium ${
                    resetStep === 2 ? "text-blue-600" : "text-gray-400"
                  }`}
                >
                  Step 2: Reset Password
                </div>
              </div>
            </div>

            {resetStep === 1 ? (
              <form onSubmit={handleRequestPasswordReset} className="space-y-4">
                <div>
                  <label
                    htmlFor="reset-email"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Email Address
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="reset-email"
                      type="email"
                      className="pl-10 block w-full pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>

                {resetError && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
                    <p className="text-sm text-red-700">{resetError}</p>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {resetLoading ? (
                      <>
                        <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                        Sending...
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label
                    htmlFor="otp"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Verification Code
                  </label>
                  <input
                    id="otp"
                    type="text"
                    className="block w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center tracking-widest font-mono text-lg"
                    value={resetOtp}
                    onChange={(e) =>
                      setResetOtp(e.target.value.replace(/[^0-9]/g, ""))
                    }
                    placeholder="123456"
                    maxLength={6}
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="new-password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    New Password
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      className="pl-10 block w-full pr-10 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="text-gray-400 hover:text-gray-500 focus:outline-none"
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Password must contain at least 8 characters, including
                    uppercase, lowercase, and numbers
                  </p>
                </div>

                {resetError && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
                    <p className="text-sm text-red-700">{resetError}</p>
                  </div>
                )}

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => setResetStep(1)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {resetLoading ? (
                      <>
                        <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                        Resetting...
                      </>
                    ) : (
                      "Reset Password"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

