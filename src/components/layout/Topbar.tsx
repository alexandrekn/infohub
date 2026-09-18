import { useAuth } from "@/hooks/useAuth";
import "./Topbar.css";

const LABEL_PERFIL = {
  admin: "Administrador",
  mentor: "Mentor",
  aluno: "Aluno",
};

export function Topbar({ titulo }: { titulo: string }) {
  const { usuario, logout } = useAuth();

  return (
    <header className="ih-topbar">
      <h1>{titulo}</h1>
      <div className="ih-topbar__usuario">
        <div className="ih-topbar__usuario-info">
          <span className="ih-topbar__nome">{usuario?.nome}</span>
          <span className="ih-topbar__perfil">{usuario ? LABEL_PERFIL[usuario.perfil] : ""}</span>
        </div>
        <div className="ih-topbar__avatar" aria-hidden>
          {usuario?.nome?.charAt(0)}
        </div>
        <button className="ih-topbar__sair" onClick={logout}>
          Sair
        </button>
      </div>
    </header>
  );
}
