import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EquipeCard } from "@/components/equipes/EquipeCard";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cursosService } from "@/services/cursos.service";
import { contarPorEtapa, dataService, exportarEquipesCSV } from "@/services/data.service";
import type { Curso, Equipe, Etapa, StatusTarefa, Tarefa, Usuario } from "@/types";
import "./AdminDashboardPage.css";

const STATUS_TAREFA: StatusTarefa[] = ["Pendente", "Em andamento", "Entregue", "Atrasada", "Aprovada", "Reprovada/Ajustar"];

export function AdminDashboardPage() {
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [mentores, setMentores] = useState<Usuario[]>([]);
  const [filtroArea, setFiltroArea] = useState("");
  const [busca, setBusca] = useState("");
  const [filtroCurso, setFiltroCurso] = useState<number | "">("");
  const [filtroMentor, setFiltroMentor] = useState<number | "">("");
  const [filtroStatusTarefa, setFiltroStatusTarefa] = useState<StatusTarefa | "">("");
  const [filtroTurma, setFiltroTurma] = useState("");

  useEffect(() => {
    dataService.listarEquipes().then(setEquipes);
    dataService.listarEtapas().then(setEtapas);
    dataService.listarTodasTarefas().then(setTarefas);
    cursosService.listar().then(setCursos);
    dataService.listarUsuariosPorPerfil(["mentor"]).then(setMentores);
  }, []);

  const turmas = useMemo(() => Array.from(new Set(equipes.map((e) => e.turma))).sort(), [equipes]);
  const areas = useMemo(() => Array.from(new Set(equipes.map((e) => e.area_ideia))), [equipes]);

  const equipesFiltradas = useMemo(() => {
    const buscaLower = busca.trim().toLowerCase();
    return equipes.filter((equipe) => {
      if (filtroArea && equipe.area_ideia !== filtroArea) return false;
      if (filtroTurma && equipe.turma !== filtroTurma) return false;
      if (filtroMentor && !equipe.id_mentores.includes(filtroMentor)) return false;
      if (filtroCurso) {
        const temCurso = equipe.integrantes?.some((i) => i.usuario?.id_curso === filtroCurso);
        if (!temCurso) return false;
      }
      if (filtroStatusTarefa) {
        const temStatus = tarefas.some((t) => t.id_equipe === equipe.id_equipe && t.status === filtroStatusTarefa);
        if (!temStatus) return false;
      }
      if (buscaLower) {
        const alvo = `${equipe.nome_equipe} ${equipe.nome_ideia}`.toLowerCase();
        if (!alvo.includes(buscaLower)) return false;
      }
      return true;
    });
  }, [equipes, tarefas, busca, filtroArea, filtroTurma, filtroMentor, filtroCurso, filtroStatusTarefa]);

  const contagemPorEtapa = useMemo(() => contarPorEtapa(equipesFiltradas), [equipesFiltradas]);
  const tarefasAtrasadas = tarefas.filter((t) => t.status === "Atrasada").length;
  const prontasParaInovAMF = equipes.filter((e) => e.id_etapa_atual === 6).length;

  function limparFiltros() {
    setBusca("");
    setFiltroArea("");
    setFiltroCurso("");
    setFiltroMentor("");
    setFiltroStatusTarefa("");
    setFiltroTurma("");
  }

  return (
    <DashboardLayout titulo="Funil de equipes">
      <section className="ih-indicadores">
        <Card className="ih-indicador">
          <span className="ih-indicador__valor">{equipes.length}</span>
          <span className="ih-indicador__label">Equipes ativas</span>
        </Card>
        <Card className="ih-indicador">
          <span className="ih-indicador__valor">{tarefasAtrasadas}</span>
          <span className="ih-indicador__label">Tarefas atrasadas</span>
        </Card>
        <Card className="ih-indicador">
          <span className="ih-indicador__valor">{prontasParaInovAMF}</span>
          <span className="ih-indicador__label">Prontas para o InovAMF</span>
        </Card>
      </section>

      <Card className="ih-admin__busca-avancada">
        <div className="ih-admin__linha-busca">
          <input
            className="ih-field__input"
            placeholder="Buscar por equipe ou ideia…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <select className="ih-field__input" value={filtroCurso} onChange={(e) => setFiltroCurso(e.target.value ? Number(e.target.value) : "")}>
            <option value="">Todos os cursos</option>
            {cursos.map((curso) => (
              <option key={curso.id_curso} value={curso.id_curso}>
                {curso.nome}
              </option>
            ))}
          </select>
          <select className="ih-field__input" value={filtroMentor} onChange={(e) => setFiltroMentor(e.target.value ? Number(e.target.value) : "")}>
            <option value="">Todos os mentores</option>
            {mentores.map((mentor) => (
              <option key={mentor.id_usuario} value={mentor.id_usuario}>
                {mentor.nome}
              </option>
            ))}
          </select>
          <select
            className="ih-field__input"
            value={filtroStatusTarefa}
            onChange={(e) => setFiltroStatusTarefa(e.target.value as StatusTarefa | "")}
          >
            <option value="">Status de tarefa (todos)</option>
            {STATUS_TAREFA.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <select className="ih-field__input" value={filtroTurma} onChange={(e) => setFiltroTurma(e.target.value)}>
            <option value="">Todas as turmas</option>
            {turmas.map((turma) => (
              <option key={turma} value={turma}>
                {turma}
              </option>
            ))}
          </select>
        </div>
        <div className="ih-admin__linha-acoes">
          <button className="ih-admin__limpar" onClick={limparFiltros}>
            Limpar filtros
          </button>
          <Button variant="secondary" onClick={() => exportarEquipesCSV(equipesFiltradas, etapas)}>
            Exportar CSV
          </Button>
        </div>
      </Card>

      <div className="ih-admin__filtros">
        <button
          className={`ih-admin__filtro ${filtroArea === "" ? "ih-admin__filtro--ativo" : ""}`}
          onClick={() => setFiltroArea("")}
        >
          Todas as áreas
        </button>
        {areas.map((area) => (
          <button
            key={area}
            className={`ih-admin__filtro ${filtroArea === area ? "ih-admin__filtro--ativo" : ""}`}
            onClick={() => setFiltroArea(area)}
          >
            {area}
          </button>
        ))}
      </div>

      <div className="ih-kanban">
        {etapas.map((etapa) => (
          <div className="ih-kanban__coluna" key={etapa.id_etapa}>
            <div className="ih-kanban__coluna-header">
              <span>{etapa.nome}</span>
              <span className="ih-kanban__contador">{contagemPorEtapa[etapa.id_etapa] ?? 0}</span>
            </div>
            <div className="ih-kanban__cards">
              {equipesFiltradas
                .filter((e) => e.id_etapa_atual === etapa.id_etapa)
                .map((equipe) => (
                  <EquipeCard
                    key={equipe.id_equipe}
                    equipe={equipe}
                    mentores={equipe.mentores ?? []}
                  />
                ))}
              {contagemPorEtapa[etapa.id_etapa] === undefined && (
                <p className="ih-kanban__vazio">Nenhuma equipe nesta etapa</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
