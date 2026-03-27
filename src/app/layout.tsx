import { Auth0Provider } from "@auth0/nextjs-auth0/client";
import "./globals.css";

export const metadata = {
  title: "Caregiver Agent",
  description: "Secure AI delegation for caregivers",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Auth0Provider>{children}</Auth0Provider>
      </body>
    </html>
  );
}