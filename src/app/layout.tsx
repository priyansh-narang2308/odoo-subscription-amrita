import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import "@fontsource-variable/inter";
import "@fontsource/caveat/600.css";
import "@fontsource/caveat/700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Brightloop Subscriptions", template: "%s · Brightloop" },
  description:
    "Plans, subscriptions, recurring billing and revenue reporting in one place.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
