import { NavLink } from "react-router-dom";
import logoCompact from "@/assets/logo-infohub-compact.png";
import type { PerfilUsuario } from "@/types";
import "./Sidebar.css";

interface ItemMenu {
  to: string;
  label: string;
  icone: string;
}

const MENU_POR_PERFIL: Record<PerfilUsuario, ItemMenu[]> = {
  admin: [
    { to: "/", label: "Funil de equipes", icone: "🗂️" },
    { to: "/usuarios", label: "Usuários", icone: "👥" },
  ],
  mentor: [
    { to: "/", label: "Minhas equipes", icone: "🧭" },
  ],
  aluno: [
    { to: "/", label: "Minha jornada", icone: "🚀" },
  ],
};

export function Sidebar({ perfil }: { perfil: PerfilUsuario }) {
  const itens = MENU_POR_PERFIL[perfil];

  return (
    <aside className="ih-sidebar">
      <div className="ih-sidebar__brand">
        <img src={logoCompact} alt="InfoHub" className="ih-sidebar__logo" />
      </div>
      <nav className="ih-sidebar__nav">
        {itens.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) => `ih-sidebar__link ${isActive ? "ih-sidebar__link--ativo" : ""}`}
          >
            <span aria-hidden>{item.icone}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
