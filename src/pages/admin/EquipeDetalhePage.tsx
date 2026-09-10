import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { StageTracker } from "@/components/ui/StageTracker";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import { dataService, MODELOS_TAREFA_POR_ETAPA } from "@/services/data.service";
import type { Anotacao, Entregavel, Equipe, Etapa, HistoricoEtapa, Tarefa } from "@/types";
import "./EquipeDetalhePage.css";

export function EquipeDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const { usuario } = useAuth();

  const [equipe, setEquipe] = useState<Equipe | null>(null);
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [historico, setHistorico] = useState<HistoricoEtapa[]>([]);
  const [anotacoes, setAnotacoes] = useState<Anotacao[]>([]);
  const [entregaveisPorTarefa, setEntregaveisPorTarefa] = useState<Record<number, Entregavel[]>>({});

  const idEquipe = Number(id);

  async function recarregar() {
    const [eq, hist, anots, tf] = await Promise.all([
      dataService.buscarEquipe(idEquipe),
      dataService.listarHistoricoEtapas(idEquipe),
      dataService.listarAnotacoes(idEquipe),
      dataService.listarTarefasPorEquipe(idEquipe),
    ]);
    setEquipe(eq ?? null);
    setHistorico(hist);
    setAnotacoes(anots);
    setTarefas(tf);
    const entradas = await Promise.all(
      tf.map(async (t) => [t.id_tarefa, await dataService.listarEntregaveisPorTarefa(t.id_tarefa)] as const)
    );
    setEntregaveisPorTarefa(Object.fromEntries(entradas));
  }

  useEffect(() => {
    if (!id) return;
    dataService.listarEtapas().then(setEtapas);
    recarregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!equipe || !usuario) {
    return (
      <DashboardLayout titulo="Equipe">
        <p>Carregando…</p>
      </DashboardLayout>
    );
  }

  const mentores = equipe.mentores ?? [];
  const souAdmin = usuario.perfil === "admin";
  const souMentorDaEquipe = usuario.perfil === "mentor" && equipe.id_mentores?.includes(usuario.id_usuario);
  const souIntegranteDaEquipe = usuario.perfil === "aluno" && equipe.integrantes?.some((i) => i.id_usuario === usuario.id_usuario);
  const podeGerenciarEtapa = souAdmin || souMentorDaEquipe; // RF-09 / RN-01
  const podeAnotar = souAdmin || souMentorDaEquipe; // RF-10 — nunca visível ao aluno
  const podeAvaliarTarefas = souAdmin || souMentorDaEquipe; // RF-15
  const podeAlterarPrazo = Boolean(souMentorDaEquipe); // decisão da equipe: só o mentor altera prazo
  const podeCriarTarefa = souAdmin || souMentorDaEquipe; // RF-11
  const podeAnexarEntrega = Boolean(souIntegranteDaEquipe); // RF-14

  async function avancarEtapa() {
    await dataService.avancarEtapa(idEquipe);
    recarregar();
  }

  async function retrocederEtapa() {
    await dataService.retrocederEtapa(idEquipe);
    recarregar();
  }

  return (
    <DashboardLayout titulo={equipe.nome_equipe}>
      <Card className="ih-detalhe__tracker">
        <StageTracker etapas={etapas} etapaAtualId={equipe.id_etapa_atual} />
        {podeGerenciarEtapa && (
          <div className="ih-detalhe__acoes-etapa">
            <Button variant="secondary" onClick={retrocederEtapa} disabled={equipe.id_etapa_atual <= 1}>
              ← Retroceder etapa
            </Button>
            <Button onClick={avancarEtapa} disabled={equipe.id_etapa_atual >= etapas.length}>
              Avançar etapa →
            </Button>
          </div>
        )}
      </Card>

      <div className="ih-detalhe__grid">
        <Card className="ih-detalhe__bloco">
          <h3>Sobre a ideia</h3>
          <dl className="ih-detalhe__lista">
            <div>
              <dt>Nome da ideia</dt>
              <dd>{equipe.nome_ideia}</dd>
            </div>
            <div>
              <dt>Descrição</dt>
              <dd>{equipe.descricao_ideia}</dd>
            </div>
            <div>
              <dt>Área</dt>
              <dd>{equipe.area_ideia}</dd>
            </div>
            <div>
              <dt>Estágio</dt>
              <dd>{equipe.estagio_ideia}</dd>
            </div>
            <div>
              <dt>Turma</dt>
              <dd>{equipe.turma}</dd>
            </div>
            <div>
              <dt>Mentor(es)</dt>
              <dd>{mentores.length ? mentores.map((m) => m.nome).join(", ") : "Ainda não atribuído"}</dd>
            </div>
            {equipe.link_pitch && (
              <div>
                <dt>Pitch vídeo</dt>
                <dd>
                  <a href={equipe.link_pitch} target="_blank" rel="noreferrer">
                    Assistir no YouTube ↗
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </Card>

        <Card className="ih-detalhe__bloco">
          <h3>Integrantes</h3>
          <ul className="ih-detalhe__integrantes">
            {equipe.integrantes?.map((integrante) => (
              <li key={integrante.id_equipe_usuario}>
                <span className="ih-detalhe__integrante-nome">{integrante.usuario?.nome}</span>
                <span className="ih-detalhe__integrante-papel">
                  {integrante.papel === "lider" ? "Líder" : "Integrante"}
                </span>
              </li>
            ))}
          </ul>

          <h3 className="ih-detalhe__subtitulo">Histórico de etapas</h3>
          <ul className="ih-detalhe__historico">
            {historico.map((h) => (
              <li key={h.id_etapa}>
                <span>{etapas.find((e) => e.id_etapa === h.id_etapa)?.nome}</span>
                <span className="ih-detalhe__historico-data">
                  {new Date(h.data_entrada).toLocaleDateString("pt-BR")}
                </span>
              </li>
            ))}
            {historico.length === 0 && <li className="ih-detalhe__historico-vazio">Sem histórico ainda.</li>}
          </ul>
        </Card>
      </div>

      <TarefasSecao
        tarefas={tarefas}
        etapas={etapas}
        entregaveisPorTarefa={entregaveisPorTarefa}
        podeAvaliarTarefas={podeAvaliarTarefas}
        podeAlterarPrazo={podeAlterarPrazo}
        podeAnexarEntrega={podeAnexarEntrega}
        podeCriarTarefa={podeCriarTarefa}
        idEquipe={idEquipe}
        idUsuario={usuario.id_usuario}
        etapaAtual={equipe.id_etapa_atual}
        onMudou={recarregar}
      />

      {podeAnotar && (
        <AnotacoesSecao
          anotacoes={anotacoes}
          idEquipe={idEquipe}
          idEtapa={equipe.id_etapa_atual}
          idUsuario={usuario.id_usuario}
          onMudou={recarregar}
        />
      )}
    </DashboardLayout>
  );
}

// ---------------------------------------------------------------------------

function TarefasSecao({
  tarefas,
  etapas,
  entregaveisPorTarefa,
  podeAvaliarTarefas,
  podeAlterarPrazo,
  podeAnexarEntrega,
  podeCriarTarefa,
  idEquipe,
  idUsuario,
  etapaAtual,
  onMudou,
}: {
  tarefas: Tarefa[];
  etapas: Etapa[];
  entregaveisPorTarefa: Record<number, Entregavel[]>;
  podeAvaliarTarefas: boolean;
  podeAlterarPrazo: boolean;
  podeAnexarEntrega: boolean;
  podeCriarTarefa: boolean;
  idEquipe: number;
  idUsuario: number;
  etapaAtual: number;
  onMudou: () => void;
}) {
  const [mostrarForm, setMostrarForm] = useState(false);

  return (
    <Card className="ih-detalhe__bloco">
      <div className="ih-detalhe__cabecalho-secao">
        <h3>Tarefas</h3>
        {podeCriarTarefa && (
          <Button variant="secondary" onClick={() => setMostrarForm((v) => !v)}>
            {mostrarForm ? "Cancelar" : "+ Nova tarefa"}
          </Button>
        )}
      </div>

      {mostrarForm && (
        <NovaTarefaForm
          etapas={etapas}
          idEquipe={idEquipe}
          etapaAtual={etapaAtual}
          onCriada={() => {
            setMostrarForm(false);
            onMudou();
          }}
        />
      )}

      <div className="ih-tarefas-lista">
        {tarefas.map((tarefa) => (
          <TarefaLinha
            key={tarefa.id_tarefa}
            tarefa={tarefa}
            etapaNome={etapas.find((e) => e.id_etapa === tarefa.id_etapa)?.nome ?? ""}
            entregaveis={entregaveisPorTarefa[tarefa.id_tarefa] ?? []}
            podeAvaliarTarefas={podeAvaliarTarefas}
            podeAlterarPrazo={podeAlterarPrazo}
            podeAnexarEntrega={podeAnexarEntrega}
            idEquipe={idEquipe}
            idUsuario={idUsuario}
            onMudou={onMudou}
          />
        ))}
        {tarefas.length === 0 && <p className="ih-tabela__vazio">Nenhuma tarefa atribuída ainda.</p>}
      </div>
    </Card>
  );
}

function NovaTarefaForm({
  etapas,
  idEquipe,
  etapaAtual,
  onCriada,
}: {
  etapas: Etapa[];
  idEquipe: number;
  etapaAtual: number;
  onCriada: () => void;
}) {
  const [idEtapa, setIdEtapa] = useState(etapaAtual);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [dataLimite, setDataLimite] = useState("");
  const [lembretes, setLembretes] = useState<string[]>([""]);
  const [enviando, setEnviando] = useState(false);

  const modelos = MODELOS_TAREFA_POR_ETAPA[idEtapa] ?? [];

  function aplicarModelo(indice: number) {
    const modelo = modelos[indice];
    if (modelo) {
      setTitulo(modelo.titulo);
      setDescricao(modelo.descricao);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim() || !dataLimite) return;
    setEnviando(true);
    await dataService.criarTarefa({
      idEquipe,
      idEtapa,
      titulo,
      descricao,
      dataLimite,
      datasLembrete: lembretes.filter(Boolean),
    });
    setEnviando(false);
    onCriada();
  }

  return (
    <form className="ih-nova-tarefa" onSubmit={handleSubmit}>
      <div className="ih-nova-tarefa__linha">
        <div className="ih-field">
          <label className="ih-field__label" htmlFor="nt-etapa">
            Etapa relacionada
          </label>
          <select
            id="nt-etapa"
            className="ih-field__input"
            value={idEtapa}
            onChange={(e) => setIdEtapa(Number(e.target.value))}
          >
            {etapas.map((etapa) => (
              <option key={etapa.id_etapa} value={etapa.id_etapa}>
                {etapa.nome}
              </option>
            ))}
          </select>
        </div>
        <Input label="Prazo" type="date" value={dataLimite} onChange={(e) => setDataLimite(e.target.value)} required />
      </div>

      {modelos.length > 0 && (
        <div className="ih-nova-tarefa__modelos">
          <span>Modelos desta etapa:</span>
          {modelos.map((modelo, i) => (
            <button type="button" key={modelo.titulo} onClick={() => aplicarModelo(i)}>
              {modelo.titulo}
            </button>
          ))}
        </div>
      )}

      <Input label="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
      <div className="ih-field">
        <label className="ih-field__label" htmlFor="nt-descricao">
          Descrição / instruções
        </label>
        <textarea
          id="nt-descricao"
          className="ih-field__input"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />
      </div>

      <div className="ih-nova-tarefa__lembretes">
        <span className="ih-field__label">Lembretes automáticos por e-mail (RF-17)</span>
        {lembretes.map((valor, i) => (
          <input
            key={i}
            type="date"
            className="ih-field__input"
            value={valor}
            onChange={(e) =>
              setLembretes((atual) => atual.map((v, idx) => (idx === i ? e.target.value : v)))
            }
          />
        ))}
        <button type="button" className="ih-nova-tarefa__add-lembrete" onClick={() => setLembretes((a) => [...a, ""])}>
          + adicionar data de lembrete
        </button>
      </div>

      <Button type="submit" loading={enviando}>
        Criar tarefa
      </Button>
    </form>
  );
}

function TarefaLinha({
  tarefa,
  etapaNome,
  entregaveis,
  podeAvaliarTarefas,
  podeAlterarPrazo,
  podeAnexarEntrega,
  idEquipe,
  idUsuario,
  onMudou,
}: {
  tarefa: Tarefa;
  etapaNome: string;
  entregaveis: Entregavel[];
  podeAvaliarTarefas: boolean;
  podeAlterarPrazo: boolean;
  podeAnexarEntrega: boolean;
  idEquipe: number;
  idUsuario: number;
  onMudou: () => void;
}) {
  const [expandido, setExpandido] = useState(false);
  const [editandoPrazo, setEditandoPrazo] = useState(false);
  const [novoPrazo, setNovoPrazo] = useState(tarefa.data_limite);
  const [mostrarReprovar, setMostrarReprovar] = useState(false);
  const [comentario, setComentario] = useState("");
  const [urlEntrega, setUrlEntrega] = useState("");
  const [tipoEntrega, setTipoEntrega] = useState("Link");
  const [processando, setProcessando] = useState(false);

  async function aprovar() {
    setProcessando(true);
    await dataService.aprovarTarefa(tarefa.id_tarefa);
    setProcessando(false);
    onMudou();
  }

  async function confirmarReprovar() {
    setProcessando(true);
    await dataService.reprovarTarefa(tarefa.id_tarefa, comentario, {
      idEquipe,
      idEtapa: tarefa.id_etapa,
      idUsuario,
    });
    setProcessando(false);
    setMostrarReprovar(false);
    setComentario("");
    onMudou();
  }

  async function salvarPrazo() {
    setProcessando(true);
    try {
      await dataService.alterarPrazoTarefa(tarefa.id_tarefa, novoPrazo);
      setEditandoPrazo(false);
      onMudou();
    } catch {
      alert("Não foi possível alterar o prazo. Só o mentor da equipe pode fazer isso.");
    } finally {
      setProcessando(false);
    }
  }

  async function enviarEntrega() {
    if (!urlEntrega.trim()) return;
    setProcessando(true);
    await dataService.anexarEntrega({ idTarefa: tarefa.id_tarefa, idUsuario, arquivoUrl: urlEntrega, tipo: tipoEntrega });
    setProcessando(false);
    setUrlEntrega("");
    onMudou();
  }

  return (
    <div className="ih-tarefa-linha">
      <button type="button" className="ih-tarefa-linha__cabecalho" onClick={() => setExpandido((v) => !v)}>
        <div>
          <strong>{tarefa.titulo}</strong>
          <span className="ih-tarefa-linha__meta">
            {etapaNome} · prazo {new Date(tarefa.data_limite).toLocaleDateString("pt-BR")}
          </span>
        </div>
        <StatusBadge status={tarefa.status} />
      </button>

      {expandido && (
        <div className="ih-tarefa-linha__corpo">
          <p>{tarefa.descricao}</p>

          <div className="ih-tarefa-linha__prazo">
            {editandoPrazo ? (
              <>
                <input
                  type="date"
                  className="ih-field__input"
                  value={novoPrazo}
                  onChange={(e) => setNovoPrazo(e.target.value)}
                />
                <Button variant="secondary" onClick={salvarPrazo}>
                  Salvar prazo
                </Button>
              </>
            ) : (
              podeAlterarPrazo && (
                <button type="button" className="ih-tarefa-linha__link" onClick={() => setEditandoPrazo(true)}>
                  Alterar prazo (mentor)
                </button>
              )
            )}
          </div>

          <div className="ih-tarefa-linha__entregas">
            <h4>Entregas (histórico de versões)</h4>
            {entregaveis.length === 0 && <p className="ih-tarefa-linha__sem-entrega">Nenhum arquivo enviado ainda.</p>}
            <ul>
              {entregaveis.map((entrega) => (
                <li key={entrega.id_entregavel}>
                  <span>v{entrega.versao}</span>
                  <a href={entrega.arquivo_url} target="_blank" rel="noreferrer">
                    {entrega.tipo ?? "Arquivo"} ↗
                  </a>
                  <span className="ih-tarefa-linha__data-entrega">
                    {new Date(entrega.data_envio).toLocaleDateString("pt-BR")}
                  </span>
                </li>
              ))}
            </ul>

            {podeAnexarEntrega && tarefa.status !== "Aprovada" && (
              <div className="ih-tarefa-linha__anexar">
                <select className="ih-field__input" value={tipoEntrega} onChange={(e) => setTipoEntrega(e.target.value)}>
                  <option value="Link">Link (YouTube/Drive)</option>
                  <option value="PDF">PDF</option>
                  <option value="Imagem">Imagem</option>
                </select>
                <input
                  className="ih-field__input"
                  placeholder="URL do arquivo/link"
                  value={urlEntrega}
                  onChange={(e) => setUrlEntrega(e.target.value)}
                />
                <Button variant="secondary" onClick={enviarEntrega} loading={processando}>
                  Enviar entrega
                </Button>
              </div>
            )}
          </div>

          {podeAvaliarTarefas && tarefa.status !== "Aprovada" && (
            <div className="ih-tarefa-linha__avaliacao">
              <Button onClick={aprovar} loading={processando}>
                Aprovar
              </Button>
              <Button variant="danger" onClick={() => setMostrarReprovar((v) => !v)}>
                Solicitar ajuste
              </Button>
              {mostrarReprovar && (
                <div className="ih-tarefa-linha__reprovar">
                  <textarea
                    className="ih-field__input"
                    placeholder="O que precisa ser ajustado?"
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                  />
                  <Button variant="danger" onClick={confirmarReprovar} loading={processando}>
                    Confirmar e notificar aluno
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

function AnotacoesSecao({
  anotacoes,
  idEquipe,
  idEtapa,
  idUsuario,
  onMudou,
}: {
  anotacoes: Anotacao[];
  idEquipe: number;
  idEtapa: number;
  idUsuario: number;
  onMudou: () => void;
}) {
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function adicionar() {
    if (!texto.trim()) return;
    setEnviando(true);
    await dataService.criarAnotacao({ idEquipe, idEtapa, idUsuario, descricao: texto });
    setTexto("");
    setEnviando(false);
    onMudou();
  }

  return (
    <Card className="ih-detalhe__bloco">
      <h3>Anotações internas</h3>
      <p className="ih-anotacoes__aviso">Visíveis só para admin e mentores — o aluno nunca vê esta seção.</p>
      <div className="ih-anotacoes__form">
        <textarea
          className="ih-field__input"
          placeholder="Registrar observação sobre esta equipe ou encontro…"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
        <Button variant="secondary" onClick={adicionar} loading={enviando}>
          Adicionar anotação
        </Button>
      </div>
      <ul className="ih-anotacoes__lista">
        {anotacoes.map((anotacao) => {
          const autor = anotacao.autor;
          return (
            <li key={anotacao.id_anotacao}>
              <p>{anotacao.descricao}</p>
              <span>
                {autor?.nome ?? "—"} · {new Date(anotacao.data_registro).toLocaleDateString("pt-BR")}
              </span>
            </li>
          );
        })}
        {anotacoes.length === 0 && <li className="ih-anotacoes__vazio">Nenhuma anotação ainda.</li>}
      </ul>
    </Card>
  );
}
