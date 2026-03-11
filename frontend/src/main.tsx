import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

type Health = {
  status: string;
  service: string;
};

function App() {
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    fetch("http://localhost:8000/api/health")
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Backend is not ready");
        }
        return res.json();
      })
      .then((data: Health) => setHealth(data))
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <main style={{ fontFamily: "sans-serif", padding: "2rem" }}>
      <h1>AltoTech Assessment Dashboard</h1>
      <p>Scaffold is running. Next step is full feature implementation.</p>
      {health ? (
        <p>
          API status: {health.status} ({health.service})
        </p>
      ) : (
        <p>{error || "Checking backend health..."}</p>
      )}
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
