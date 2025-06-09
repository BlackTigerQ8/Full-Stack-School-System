"use client";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ToastProvider() {
  return (
    <ToastContainer
      position="bottom-right"
      theme="light"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
    />
  );
}
