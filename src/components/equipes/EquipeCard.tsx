import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { nomeEtapaAtual } from "@/services/data.service";
import type { Equipe, Usuario } from "@/types";
import "./EquipeCard.css";

export function EquipeCard({ equipe, mentores }: { equipe: Equipe; mentores?: Usuario[] }) {
  const lider = equipe.integrantes?.find((i) => i.papel === "lider")?.usuario;
  const nomesMentores = mentores?.map((m) => m.nome).join(", ");

  return (
    <Link to={`/equipes/${equipe.id_equipe}`} className="ih-equipe-card">
      <Card className="ih-equipe-card__inner">
        <div className="ih-equipe-card__header">
          <strong>{equipe.nome_equipe}</strong>
          <Badge tom="neutro">{equipe.area_ideia}</Badge>
        </div>
        <p className="ih-equipe-card__ideia">{equipe.nome_ideia}</p>
        <p className="ih-equipe-card__etapa">{nomeEtapaAtual(equipe)}</p>
        <div className="ih-equipe-card__footer">
          <span>Líder: {lider?.nome ?? "—"}</span>
          <span>{nomesMentores ? `Mentor(es): ${nomesMentores}` : "Sem mentor"}</span>
        </div>
      </Card>
    </Link>
  );
}
