import { AdminDashboardPage } from "@/pages/admin/AdminDashboardPage";
import { MentorDashboardPage } from "@/pages/mentor/MentorDashboardPage";
import { AlunoDashboardPage } from "@/pages/aluno/AlunoDashboardPage";
import { useAuth } from "@/hooks/useAuth";

export function HomePage() {
  const { usuario } = useAuth();

  if (usuario?.perfil === "admin") return <AdminDashboardPage />;
  if (usuario?.perfil === "mentor") return <MentorDashboardPage />;
  return <AlunoDashboardPage />;
}
