import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SessionProvider from "@/components/SessionProvider";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BlackTigerQ8 School Management Dashboard",
  description: "Next.js School Management System",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider session={session}>
          {children}
          <ToastContainer
            position="bottom-right"
            theme="dark"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
          />
        </SessionProvider>
      </body>
    </html>
  );
}
