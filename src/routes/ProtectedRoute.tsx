import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import type { PerfilUsuario } from "@/types";

interface ProtectedRouteProps {
  perfisPermitidos?: PerfilUsuario[];
}

export function ProtectedRoute({ perfisPermitidos }: ProtectedRouteProps) {
  const { usuario, carregando } = useAuth();

  if (carregando) return null;

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (perfisPermitidos && !perfisPermitidos.includes(usuario.perfil)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
