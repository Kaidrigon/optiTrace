
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OptiTrace — See what your code becomes",
  description:
    "Explore compiler optimization passes, inspect transformations, and understand how programs change.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
