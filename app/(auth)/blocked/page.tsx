"use client"; // Обязательно, так как используем функцию signOut

import { signOut } from "next-auth/react";

export default function BlockedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="max-w-md w-full text-center p-8 bg-white rounded-xl shadow-lg border border-red-100">
        <div className="text-red-500 mb-4 flex justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Аккаунт заблокирован</h1>
        <p className="text-gray-600 mb-6">
          Ваш доступ к порталу закупок был ограничен администратором. 
          Если вы считаете, что это ошибка, обратитесь в службу поддержки.
        </p>
        
        <button 
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
        >
          Выйти из системы
        </button>
      </div>
    </div>
  );
}