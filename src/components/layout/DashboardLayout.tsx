import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useAuth } from "@/hooks/useAuth";
import "./DashboardLayout.css";

export function DashboardLayout({ titulo, children }: { titulo: string; children: ReactNode }) {
  const { usuario } = useAuth();
  if (!usuario) return null;

  return (
    <div className="ih-dashboard">
      <Sidebar perfil={usuario.perfil} />
      <div className="ih-dashboard__main">
        <Topbar titulo={titulo} />
        <div className="ih-dashboard__content">{children}</div>
      </div>
    </div>
  );
}
