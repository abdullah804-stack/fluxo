import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import ConnectWhatsApp from "./ConnectWhatsApp";

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { whatsappAccount: true },
  });

  if (!user) {
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

        {user.whatsappAccount ? (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              WhatsApp connected
            </h2>
            <p className="text-sm text-gray-500">
              Number: {user.whatsappAccount.phoneNumber}
            </p>
            <p className="text-sm text-gray-500">
              Connected:{" "}
              {new Date(user.whatsappAccount.connectedAt).toLocaleString()}
            </p>
          </div>
        ) : (
          <ConnectWhatsApp />
        )}
      </div>
    </div>
  );
}