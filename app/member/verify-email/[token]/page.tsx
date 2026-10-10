"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type VerificationState = "loading" | "success" | "error";

export default function VerifyEmailPage({ params }: { params: { token: string } }) {
  const [state, setState] = useState<VerificationState>("loading");
  const [message, setMessage] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const res = await fetch("/api/members/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: params.token }),
        });

        const data = await res.json();

        if (res.ok && data.ok) {
          setState("success");
          setMessage(data.message || "Email verified successfully!");
          setEmail(data.email || "");

          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push("/member/login?verified=true");
          }, 3000);
        } else {
          setState("error");
          setMessage(data.error || "Verification failed. Please try again.");
        }
      } catch (err) {
        setState("error");
        setMessage("Network error. Please check your connection and try again.");
      }
    };

    verifyEmail();
  }, [params.token, router]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0A0D12 0%, #161D2B 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
    >
      <div
        style={{
          background: "#0F131C",
          borderRadius: "12px",
          padding: "3rem 2rem",
          maxWidth: "28rem",
          width: "100%",
          textAlign: "center",
          border: "1px solid rgba(255, 255, 255, 0.05)",
        }}
      >
        {state === "loading" && (
          <>
            <div
              style={{
                width: "3rem",
                height: "3rem",
                border: "3px solid rgba(56, 189, 248, 0.2)",
                borderTop: "3px solid #38BDF8",
                borderRadius: "50%",
                margin: "0 auto 1.5rem",
                animation: "spin 1s linear infinite",
              }}
            />
            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: "600",
                color: "#E5E7EB",
                marginBottom: "0.75rem",
              }}
            >
              Verifying your email...
            </h1>
            <p style={{ color: "#9CA3AF", fontSize: "0.95rem" }}>
              Please wait while we verify your account.
            </p>
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </>
        )}

        {state === "success" && (
          <>
            <div
              style={{
                width: "4rem",
                height: "4rem",
                background: "rgba(110, 231, 183, 0.1)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.5rem",
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#6EE7B7"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: "600",
                color: "#6EE7B7",
                marginBottom: "0.75rem",
              }}
            >
              Email Verified!
            </h1>
            <p style={{ color: "#9CA3AF", fontSize: "0.95rem", marginBottom: "0.5rem" }}>
              {message}
            </p>
            {email && (
              <p style={{ color: "#6B7280", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
                {email}
              </p>
            )}
            <p style={{ color: "#6B7280", fontSize: "0.85rem" }}>
              Redirecting you to login...
            </p>
          </>
        )}

        {state === "error" && (
          <>
            <div
              style={{
                width: "4rem",
                height: "4rem",
                background: "rgba(239, 68, 68, 0.1)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.5rem",
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#EF4444"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: "600",
                color: "#EF4444",
                marginBottom: "0.75rem",
              }}
            >
              Verification Failed
            </h1>
            <p style={{ color: "#9CA3AF", fontSize: "0.95rem", marginBottom: "1.5rem" }}>
              {message}
            </p>
            <button
              onClick={() => router.push("/member/register")}
              style={{
                background: "rgba(56, 189, 248, 0.1)",
                color: "#38BDF8",
                border: "1px solid rgba(56, 189, 248, 0.2)",
                padding: "0.75rem 1.5rem",
                borderRadius: "999px",
                fontSize: "0.95rem",
                fontWeight: "500",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = "rgba(56, 189, 248, 0.15)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "rgba(56, 189, 248, 0.1)";
              }}
            >
              Back to Registration
            </button>
          </>
        )}
      </div>
    </div>
  );
}
