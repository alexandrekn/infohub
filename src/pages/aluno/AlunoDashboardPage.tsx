import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { StageTracker } from "@/components/ui/StageTracker";
import { useAuth } from "@/hooks/useAuth";
import { dataService } from "@/services/data.service";
import type { Equipe, Etapa, Tarefa } from "@/types";
import logoIcon from "@/assets/logo-infohub-icon.png";
import "./AlunoDashboardPage.css";

export function AlunoDashboardPage() {
  const { usuario } = useAuth();
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [tarefasPorEquipe, setTarefasPorEquipe] = useState<Record<number, Tarefa[]>>({});

  useEffect(() => {
    if (!usuario) return;
    dataService.listarEtapas().then(setEtapas);
    dataService.listarEquipesDoAluno(usuario.id_usuario).then(async (lista) => {
      setEquipes(lista);
      const entradas = await Promise.all(
        lista.map(async (equipe) => [equipe.id_equipe, await dataService.listarTarefasPorEquipe(equipe.id_equipe)] as const)
      );
      setTarefasPorEquipe(Object.fromEntries(entradas));
    });
  }, [usuario]);

  if (equipes.length === 0) {
    return (
      <DashboardLayout titulo="Minha jornada">
        <Card className="ih-aluno__vazio">
          <img src={logoIcon} alt="" className="ih-aluno__vazio-icone" aria-hidden />
          <p>Você ainda não faz parte de uma equipe.</p>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout titulo="Minha jornada">
      {equipes.map((equipe) => {
        const mentores = equipe.mentores ?? [];
        const tarefas = tarefasPorEquipe[equipe.id_equipe] ?? [];
        const pendentes = tarefas.filter((t) => t.status !== "Aprovada");
        const concluidas = tarefas.filter((t) => t.status === "Aprovada");

        return (
          <Card className="ih-aluno__equipe" key={equipe.id_equipe}>
            <div className="ih-aluno__equipe-header">
              <div>
                <h3>{equipe.nome_equipe}</h3>
                <p>{equipe.nome_ideia}</p>
              </div>
              <Link to={`/equipes/${equipe.id_equipe}`} className="ih-aluno__ver-detalhe">
                Ver detalhes →
              </Link>
            </div>

            <div className="ih-aluno__tracker">
              <StageTracker etapas={etapas} etapaAtualId={equipe.id_etapa_atual} />
            </div>

            <p className="ih-aluno__mentor">
              {mentores.length
                ? `Mentor(es) responsável(is): ${mentores.map((m) => m.nome).join(", ")}`
                : "Ainda sem mentor atribuído"}
            </p>

            <div className="ih-aluno__tarefas">
              <h4>Tarefas pendentes ({pendentes.length})</h4>
              {pendentes.length === 0 ? (
                <p className="ih-aluno__sem-tarefas">Tudo em dia por aqui 🎉</p>
              ) : (
                <ul>
                  {pendentes.map((tarefa) => (
                    <li key={tarefa.id_tarefa}>
                      <div>
                        <strong>{tarefa.titulo}</strong>
                        <p>{tarefa.descricao}</p>
                        <span className="ih-aluno__prazo">
                          Prazo: {new Date(tarefa.data_limite).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                      <StatusBadge status={tarefa.status} />
                    </li>
                  ))}
                </ul>
              )}
              <p className="ih-aluno__dica-entrega">
                Abra <Link to={`/equipes/${equipe.id_equipe}`}>Ver detalhes</Link> para anexar o arquivo/link de uma entrega.
              </p>
            </div>

            {concluidas.length > 0 && (
              <div className="ih-aluno__tarefas ih-aluno__tarefas--concluidas">
                <h4>Tarefas concluídas ({concluidas.length})</h4>
                <ul>
                  {concluidas.map((tarefa) => (
                    <li key={tarefa.id_tarefa}>
                      <div>
                        <strong>{tarefa.titulo}</strong>
                        <span className="ih-aluno__prazo">
                          Aprovada em {new Date(tarefa.data_limite).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                      <StatusBadge status={tarefa.status} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        );
      })}
    </DashboardLayout>
  );
}
