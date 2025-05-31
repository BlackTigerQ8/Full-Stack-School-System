"use client";

import { signOut } from "next-auth/react";
import Image from "next/image";

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LogoutModal({ isOpen, onClose }: LogoutModalProps) {
  if (!isOpen) return null;

  const handleLogout = () => {
    signOut({
      callbackUrl: "/auth/signin",
      redirect: true,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <Image
              src="/logout.png"
              alt="Logout"
              width={24}
              height={24}
              className="text-red-500"
            />
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-900">
              Confirm Logout
            </h3>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-500">
            Are you sure you want to log out? You will be redirected to the
            login page.
          </p>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
