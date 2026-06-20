"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {

  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(
    e: React.FormEvent
  ) {

    e.preventDefault();

    setLoading(true);
    setError("");

    try {

      const response = await fetch(
        "http://localhost:8000/auth/login",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            username,
            password
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {

        setError(
          data.detail ||
          "Error al iniciar sesión"
        );

        return;
      }

      localStorage.setItem(
        "token",
        data.access_token
      );

      localStorage.setItem(
        "role",
        data.role
      );

      localStorage.setItem(
        "username",
        username
      );

      if (data.role === "admin") {

        router.push("/");

      } else {

        router.push("/");
      }

    } catch (err) {

      setError(
        "No se pudo conectar con el servidor"
      );

    } finally {

      setLoading(false);
    }
  }

  return (

    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">

      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl">

        <div className="text-center mb-8">

          <h1 className="text-3xl font-bold text-white">
            AuditorIA
          </h1>

          <p className="text-zinc-400 mt-2">
            Iniciar sesión
          </p>

        </div>

        <form
          onSubmit={handleLogin}
          className="space-y-5"
        >

          <div>

            <label className="block text-sm text-zinc-300 mb-2">
              Usuario
            </label>

            <input
              type="text"
              value={username}
              onChange={(e) =>
                setUsername(e.target.value)
              }
              required
              className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="admin"
            />

          </div>

          <div>

            <label className="block text-sm text-zinc-300 mb-2">
              Contraseña
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              required
              className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="********"
            />

          </div>

          {error && (

            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-300 text-sm">
              {error}
            </div>

          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition disabled:opacity-50"
          >

            {loading
              ? "Ingresando..."
              : "Iniciar Sesión"}

          </button>

        </form>

      </div>

    </div>
  );
}