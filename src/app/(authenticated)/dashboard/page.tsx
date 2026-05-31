import { currentUser } from "@clerk/nextjs/server";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

const isClerkConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== "pk_test_replace_me",
);

export default async function DashboardPage() {
  let greetingName = "comercial";
  if (isClerkConfigured) {
    const user = await currentUser();
    greetingName =
      user?.firstName ?? user?.username ?? user?.emailAddresses?.[0]?.emailAddress ?? "comercial";
  }

  return <DashboardClient greetingName={greetingName} />;
}
