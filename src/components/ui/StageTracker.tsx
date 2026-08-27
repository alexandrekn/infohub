import "./StageTracker.css";

export interface StageTrackerItem {
  id_etapa: number;
  nome: string;
}

interface StageTrackerProps {
  etapas: StageTrackerItem[];
  etapaAtualId: number;
  orientacao?: "horizontal" | "vertical";
}

/**
 * Trilha da jornada InfoHub → InovAMF.
 * Cada etapa é um nó; nós concluídos ganham o gradiente da marca (a mesma
 * dupla laranja/vermelho do bulbo no logo), o nó atual pulsa, e os
 * próximos ficam ocos — uma leitura literal do "funil" descrito no
 * documento de requisitos.
 */
export function StageTracker({ etapas, etapaAtualId, orientacao = "horizontal" }: StageTrackerProps) {
  const indiceAtual = etapas.findIndex((e) => e.id_etapa === etapaAtualId);

  return (
    <ol className={`ih-tracker ih-tracker--${orientacao}`}>
      {etapas.map((etapa, indice) => {
        const status =
          indice < indiceAtual ? "concluida" : indice === indiceAtual ? "atual" : "pendente";
        return (
          <li key={etapa.id_etapa} className={`ih-tracker__item ih-tracker__item--${status}`}>
            <span className="ih-tracker__node" aria-hidden>
              {status === "concluida" ? "✓" : indice + 1}
            </span>
            <span className="ih-tracker__label">{etapa.nome}</span>
          </li>
        );
      })}
    </ol>
  );
}
