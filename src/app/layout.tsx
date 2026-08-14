import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import VeeznaChatbot from "@/components/VeeznaChatbot";
import AICopilotWrapper from "@/components/AICopilotWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VEEZNA Educational Ecosystem",
  description: "Official Portal for VEEZNA",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col relative">
        {children}
        
        {/* Floating AI Course Advisor & Copilot */}
        <VeeznaChatbot />
        {/* Agar aap AICopilotWrapper bhi use kar rahe hain toh ise uncomment rakhein, warna hata sakte hain: */}
        {/* <AICopilotWrapper /> */}
      </body>
    </html>
  );
}