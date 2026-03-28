import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";

export default async function ConnectPage() {
  const session = await auth0.getSession();
  if (!session?.user) redirect("/auth/login");

  return (
    <main className="min-h-screen p-8 bg-white">
      <div className="mx-auto max-w-md space-y-6">
        <h1 className="text-3xl font-bold">Connect Google Account</h1>
        <p className="text-gray-600">
          Connect your Google account to allow the caregiver agent to book
          calendar events on your behalf.
        </p>
        {/* Direct Google OAuth with calendar scope */}
        <a
          href={`/auth/login?connection=google-oauth2&access_type=offline&scope=openid profile email https://www.googleapis.com/auth/calendar.events&returnTo=/dashboard?connected=true`}
          className="block rounded-xl bg-black px-5 py-3 text-center text-white hover:bg-gray-800"
        >
          Connect Google Calendar
        </a>
        <a href="/dashboard" className="block text-center text-sm text-gray-500">
          ← Back to dashboard
        </a>
      </div>
    </main>
  );
}