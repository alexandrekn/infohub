import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { LoginPage } from "@/pages/auth/LoginPage";
import { CadastroIdeiaPage } from "@/pages/auth/CadastroIdeiaPage";
import { EsqueciSenhaPage } from "@/pages/auth/EsqueciSenhaPage";
import { HomePage } from "@/pages/HomePage";
import { EquipeDetalhePage } from "@/pages/admin/EquipeDetalhePage";
import { AdminUsuariosPage } from "@/pages/admin/AdminUsuariosPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cadastro-ideia" element={<CadastroIdeiaPage />} />
      <Route path="/esqueci-senha" element={<EsqueciSenhaPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/equipes/:id" element={<EquipeDetalhePage />} />
      </Route>

      <Route element={<ProtectedRoute perfisPermitidos={["admin"]} />}>
        <Route path="/usuarios" element={<AdminUsuariosPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
