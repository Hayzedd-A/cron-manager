"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast, Toaster } from "react-hot-toast";
import { Loader2, Mail, KeyRound } from "lucide-react";
import Link from "next/link";

function InnerVerifyOtpPage() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") || "";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!email) {
      // if no email in query, send back to signup
      toast.error("Email address missing. Redirecting to signup...");
      router.replace("/auth/register");
    }
  }, [email, router]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && resendDisabled) {
      setResendDisabled(false);
    }
  }, [countdown, resendDisabled]);

  const handleVerify = async (e: React.FormEvent) => {
    try {
      e.preventDefault();
      setError("");
      setSuccess("");
      setLoading(true);

      // Show loading toast
      const loadingToast = toast.loading("Verifying your code...");

      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      if (!res.ok) {
        setError(data?.error || "Verification failed");
        toast.error(data?.error || "Verification failed");
      } else {
        setSuccess("Email verified successfully!");
        toast.success("Email verified! Redirecting to login...");
        setTimeout(() => router.push("/auth/signin"), 2000);
      }
    } catch (error) {
      console.log("Error in verify OTP", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setResendDisabled(true);
      setCountdown(60); // 60 seconds cooldown

      const resendToast = toast.loading("Sending new verification code...");

      // Implement your resend OTP API call here
      const res = await fetch("/api/auth/register", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      toast.dismiss(resendToast);

      if (!res.ok) {
        toast.error(data?.error || "Failed to resend verification code");
      } else {
        toast.success("New verification code sent to your email");
      }
    } catch (error) {
      console.log("Error resending OTP", error);
      toast.error("Failed to resend verification code");
      setResendDisabled(false);
      setCountdown(0);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <Toaster position="top-right" />

      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Verify Your Email
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            We&apos;ve sent a verification code to your email
          </p>
          <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100">
            <Mail className="h-4 w-4 mr-2 text-gray-500" />
            <span className="text-gray-800 font-medium">{email}</span>
          </div>
        </div>

        <form onSubmit={handleVerify} className="mt-8 space-y-6">
          <div>
            <label
              htmlFor="otp"
              className="block text-sm font-medium text-gray-700"
            >
              Verification Code
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <KeyRound className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="otp"
                type="text"
                className="pl-10 block w-full pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center tracking-widest font-mono text-lg"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                required
                maxLength={6}
                placeholder="123456"
              />
            </div>
            <p className="mt-2 text-xs text-gray-500 text-center">
              Enter the 6-digit code sent to your email
            </p>
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

          {success && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-green-700">{success}</p>
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
                  Verifying...
                </>
              ) : (
                "Verify Code"
              )}
            </button>
          </div>
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Didn&apos;t receive the code?{" "}
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={resendDisabled}
              className="font-medium text-blue-600 hover:text-blue-500 disabled:text-gray-400 disabled:cursor-not-allowed focus:outline-none"
            >
              {resendDisabled ? `Resend in ${countdown}s` : "Resend code"}
            </button>
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/auth/register"
            className="text-sm font-medium text-gray-600 hover:text-gray-500"
          >
            ← Back to Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InnerVerifyOtpPage />
    </Suspense>
  );
}