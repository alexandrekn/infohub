import type { ReactNode } from "react";
import "./Badge.css";
import type { StatusTarefa } from "@/types";

const MAPA_TOM: Record<StatusTarefa, "neutro" | "info" | "sucesso" | "atencao" | "erro"> = {
  Pendente: "neutro",
  "Em andamento": "info",
  Entregue: "info",
  Atrasada: "erro",
  Aprovada: "sucesso",
  "Reprovada/Ajustar": "atencao",
};

export function StatusBadge({ status }: { status: StatusTarefa }) {
  return <span className={`ih-badge ih-badge--${MAPA_TOM[status]}`}>{status}</span>;
}

export function Badge({
  tom = "neutro",
  children,
}: {
  tom?: "neutro" | "info" | "sucesso" | "atencao" | "erro";
  children: ReactNode;
}) {
  return <span className={`ih-badge ih-badge--${tom}`}>{children}</span>;
}
