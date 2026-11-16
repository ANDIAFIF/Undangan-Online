import LoginForm from "@/components/admin/LoginForm";
import "../(panel)/admin.css";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <div className="login-shell">
      <LoginForm next={next} />
    </div>
  );
}
