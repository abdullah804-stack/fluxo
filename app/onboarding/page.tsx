// app/onboarding/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { OnboardingForm } from "./OnBoardingForm";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) redirect("/login");

  // If already onboarded, skip the wizard
  if (user.businessName && user.businessType) {
    redirect("/dashboard");
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: "#F5F7FE" }}
    >
      {/* Ambient blobs */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 h-[900px] w-[1000px] rounded-full opacity-70 blur-[140px]"
          style={{
            background:
              "radial-gradient(circle, #B8CEFF 0%, rgba(184,206,255,0) 70%)",
          }}
        />
        <div
          className="absolute -bottom-40 -left-40 h-[800px] w-[800px] rounded-full opacity-55 blur-[140px]"
          style={{
            background:
              "radial-gradient(circle, #D0DEFF 0%, rgba(208,222,255,0) 70%)",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-2xl items-center px-6 py-12">
        <OnboardingForm initialName={user.businessName ?? ""} />
      </div>
    </div>
  );
}