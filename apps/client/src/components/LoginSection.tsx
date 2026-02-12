import { ReactNode, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { authClient, AuthInput } from "@/lib/auth-client";

type LoginData = Omit<AuthInput, "name">;

export default function LoginSection(): ReactNode {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loginData: LoginData = {
    email: email,
    password: password,
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await authClient.signIn.email(loginData);
      if (res.error) throw new Error(res.error.message);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An error occurred during sign-in",
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg px-6 pb-6 flex flex-col items-center justify-center">
      <Image
        src="/logo.png"
        alt="Schema Logo"
        width={120}
        height={120}
        className="object-contain mb-6"
        priority
      />
      <h1 className="text-2xl font-bold mb-2">Account Login</h1>
      <p className="text-gray-300 mb-8">Log in to start exploring schemas</p>
      <form onSubmit={handleSubmit} className="max-w-sm w-full">
        <div className="mb-4">
          <label htmlFor="email" className="block text-white mb-1">
            Email
          </label>
          <input
            required
            type="email"
            onChange={(e) => setEmail(e.target.value)}
            id="email"
            className="w-full px-4 py-2 rounded-md bg-gray-900 text-white border border-gray-700 focus:outline-none focus:border-white-500"
          />
        </div>
        <div className="mb-8">
          <label htmlFor="password" className="block text-white mb-1">
            Password
          </label>
          <input
            required
            type="password"
            onChange={(e) => setPassword(e.target.value)}
            id="password"
            className="w-full px-4 py-2 rounded-md bg-gray-900 text-white border border-gray-700 focus:outline-none focus:border-white-500"
          />
        </div>
        {error ? (
          <div className="rounded-md bg-red-300 text-black font-bold mb-4 p-2">
            {error}
          </div>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 rounded-md bg-white text-black font-bold"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
      <p className="text-gray-300 mb-4 mt-6">
        Don’t have an account?{" "}
        <Link href="/register" className="text-white font-bold">
          Register
        </Link>
      </p>
    </div>
  );
}
