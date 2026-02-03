'use client'
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function AdminLoginPage() {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const email = formData.get("email");
    const password = formData.get("password");

    const res = await signIn("credentials", {
      email,
      password,
      callbackUrl: "/admin/users",
      redirect: true,
    });
    setLoading(false);
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900">
      <form action={handleSubmit} className="bg-white p-8 rounded-[32px] w-full max-w-sm shadow-2xl">
        <h1 className="text-2xl font-black mb-6 text-center">Admin Access</h1>
        <input name="email" type="email" placeholder="Admin Email" required className="w-full mb-4 p-4 border rounded-2xl outline-none focus:ring-2 ring-blue-500" />
        <input name="password" type="password" placeholder="Password" required className="w-full mb-6 p-4 border rounded-2xl outline-none focus:ring-2 ring-blue-500" />
        <button disabled={loading} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-blue-600 transition-all">
          {loading ? "Logging in..." : "Войти в панель"}
        </button>
      </form>
    </div>
  );
}