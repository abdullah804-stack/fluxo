// app/dashboard/layout.tsx
import { redirect } from "next/navigation";
import { getCtx } from "./_lib";
import { DashboardShell } from "./_components/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { email, user } = await getCtx();

  if (!user.businessName || !user.businessType) {
    redirect("/onboarding");
  }

  return (
    <div
      className="relative min-h-screen"
      style={{ background: "#F5F7FE" }}
    >
      {/* Soft blurry blue blobs behind everything */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div
          className="blob-1 absolute -top-40 -right-40 h-[900px] w-[1000px] rounded-full opacity-70 blur-[140px]"
          style={{
            background:
              "radial-gradient(circle, #B8CEFF 0%, rgba(184,206,255,0) 70%)",
          }}
        />
        <div
          className="blob-2 absolute -bottom-40 -left-40 h-[800px] w-[800px] rounded-full opacity-55 blur-[140px]"
          style={{
            background:
              "radial-gradient(circle, #D0DEFF 0%, rgba(208,222,255,0) 70%)",
          }}
        />
        <div
          className="blob-3 absolute top-1/4 right-1/4 h-[550px] w-[550px] rounded-full opacity-35 blur-[130px]"
          style={{
            background:
              "radial-gradient(circle, #C7D7FF 0%, rgba(199,215,255,0) 70%)",
          }}
        />
        <div
          className="blob-4 absolute -top-20 left-1/3 h-[500px] w-[600px] rounded-full opacity-25 blur-[150px]"
          style={{
            background:
              "radial-gradient(circle, #DDE4FF 0%, rgba(221,228,255,0) 70%)",
          }}
        />
      </div>

      <DashboardShell
        email={email}
        name={user.name ?? email.split("@")[0]}
      >
        {children}
      </DashboardShell>
    </div>
  );
}