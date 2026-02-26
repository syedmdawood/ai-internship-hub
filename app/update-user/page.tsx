"use client";

import { useState } from "react";

export default function UpdateUserPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleClick = async () => {
    try {
      setLoading(true);
      setMessage("");

      const res = await fetch("/api/update-metadata", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setMessage("✅ User metadata updated successfully!");
    } catch (error: any) {
      setMessage(`❌ ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "40px" }}>
      <h1>Update Supabase User Metadata</h1>

      <button
        onClick={handleClick}
        disabled={loading}
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          cursor: "pointer",
        }}
      >
        {loading ? "Updating..." : "Update User"}
      </button>

      {message && (
        <p style={{ marginTop: "20px" }}>
          {message}
        </p>
      )}
    </div>
  );
}