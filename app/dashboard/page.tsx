import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">
              Signed in as {session.user.email}
            </p>
          </div>

          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="text-sm text-gray-600 hover:text-gray-900 underline"
            >
              Sign out
            </button>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-700">
            Welcome to Fluxo. Your WhatsApp business OS foundation is ready.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Next up: connect your WhatsApp Business number.
          </p>
        </div>
      </div>
    </div>
  );
}