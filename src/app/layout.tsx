import "~/app/globals.css";

import { type Metadata } from "next";

import { TRPCReactProvider } from "~/lib/trpc/client";
import { Geist } from "next/font/google";
import { cn } from "~/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: {
    default: "Parijat Boutique",
    template: "%s | Parijat Boutique",
  },
  description:
    "Discover exquisite Indian traditional wear — sarees, suits, lehengas and more. Book a personal consultation with our boutique.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body>
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}
