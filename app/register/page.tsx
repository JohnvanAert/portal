import { auth } from "@/auth";
import { redirect } from "next/navigation";
import RegisterForm from "@/components/RegisterForm";

export default async function RegisterPage() {
  const session = await auth();

  // Защита: если сессия есть, отправляем на главную
  if (session) {
    redirect("/");
  }

  // Если сессии нет, показываем форму регистрации
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <RegisterForm />
    </div>
  );
}