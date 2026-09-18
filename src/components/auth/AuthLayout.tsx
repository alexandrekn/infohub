import type { ReactNode } from "react";
import logoCompact from "@/assets/logo-infohub-compact.png";
import "./AuthLayout.css";

export function AuthLayout({
  children,
  painelTitulo,
  painelTexto,
}: {
  children: ReactNode;
  painelTitulo: string;
  painelTexto: string;
}) {
  return (
    <div className="ih-auth">
      <aside className="ih-auth__panel">
        <div className="ih-auth__brand">
          <img src={logoCompact} alt="InfoHub" className="ih-auth__logo" />
        </div>
        <div className="ih-auth__panel-copy">
          <h1>{painelTitulo}</h1>
          <p>{painelTexto}</p>
        </div>
        <ol className="ih-auth__jornada">
          <li>Envie sua ideia</li>
          <li>Converse com um mentor</li>
          <li>Construa o Canvas e o VPD</li>
          <li>Grave o pitch e siga ao InovAMF</li>
        </ol>
      </aside>
      <main className="ih-auth__content">{children}</main>
    </div>
  );
}
