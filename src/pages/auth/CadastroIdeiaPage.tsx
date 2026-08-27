import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import { cursosService } from "@/services/cursos.service";
import type { AreaIdeia, ComoConheceu, Curso, EstagioIdeia, IntegranteFormulario } from "@/types";
import "./AuthForm.css";

const AREAS: AreaIdeia[] = [
  "Saúde",
  "Educação",
  "Meio Ambiente",
  "Tecnologia",
  "Entretenimento",
  "Serviços",
  "Outro",
];

const ESTAGIOS: EstagioIdeia[] = ["Apenas ideia", "Validação", "Prototipagem", "Lançamento"];

const ORIGENS: ComoConheceu[] = ["Redes sociais", "Amigos", "Eventos", "Outros"];

// Lista de fallback caso a API de cursos ainda não esteja disponível — espelha o ENUM do banco.
const CURSOS_FALLBACK: Curso[] = [
  "Sistemas de Informação",
  "Direito",
  "Administração",
  "Gastronomia",
  "Ciências Contábeis",
  "Ontopsicologia",
  "Hotelaria",
  "Pedagogia",
].map((nome, index) => ({ id_curso: index + 1, nome }));

export function CadastroIdeiaPage() {
  const { cadastrarIdeia } = useAuth();
  const navigate = useNavigate();

  const [cursos, setCursos] = useState<Curso[]>(CURSOS_FALLBACK);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [nomeLider, setNomeLider] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [idCurso, setIdCurso] = useState<number | "">("");
  const [semestre, setSemestre] = useState("");
  const [integrantes, setIntegrantes] = useState<IntegranteFormulario[]>([]);

  const [nomeIdeia, setNomeIdeia] = useState("");
  const [descricaoIdeia, setDescricaoIdeia] = useState("");
  const [areaIdeia, setAreaIdeia] = useState<AreaIdeia | "">("");
  const [estagioIdeia, setEstagioIdeia] = useState<EstagioIdeia | "">("");
  const [comoConheceu, setComoConheceu] = useState<ComoConheceu | "">("");

  useEffect(() => {
    cursosService
      .listar()
      .then((lista) => {
        if (lista.length) setCursos(lista);
      })
      .catch(() => {
        /* mantém a lista de fallback */
      });
  }, []);

  function adicionarIntegrante() {
    setIntegrantes((atual) => [...atual, { nome: "", email: "", curso: "" }]);
  }

  function removerIntegrante(indice: number) {
    setIntegrantes((atual) => atual.filter((_, i) => i !== indice));
  }

  function atualizarIntegrante(indice: number, campo: keyof IntegranteFormulario, valor: string) {
    setIntegrantes((atual) =>
      atual.map((integrante, i) => (i === indice ? { ...integrante, [campo]: valor } : integrante))
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErro(null);

    if (!idCurso || !areaIdeia || !estagioIdeia) {
      setErro("Preencha todos os campos obrigatórios antes de enviar.");
      return;
    }

    setEnviando(true);
    try {
      await cadastrarIdeia({
        nome_lider: nomeLider,
        email,
        telefone,
        senha,
        id_curso: idCurso,
        semestre: Number(semestre),
        integrantes: integrantes.filter((i) => i.nome.trim() && i.email.trim() && i.curso.trim()),
        nome_ideia: nomeIdeia,
        descricao_ideia: descricaoIdeia,
        area_ideia: areaIdeia,
        estagio_ideia: estagioIdeia,
        como_conheceu: comoConheceu || undefined,
      });
      navigate("/", { replace: true });
    } catch {
      setErro("Não foi possível enviar sua ideia agora. Tente novamente em instantes.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AuthLayout
      painelTitulo="Toda jornada começa com uma ideia crua."
      painelTexto="Conte pra gente o que você está pensando — sua equipe, seu formulário e sua vaga na Etapa 1 do funil são criados na hora."
    >
      <form className="ih-authform ih-authform--wide" onSubmit={handleSubmit}>
        <div className="ih-authform__header">
          <h2>Enviar minha ideia</h2>
          <p>Etapa 1 da jornada InfoHub → InovAMF.</p>
        </div>

        <p className="ih-authform__section-title">Dados do responsável pelo envio</p>
        <Input label="Nome completo" value={nomeLider} onChange={(e) => setNomeLider(e.target.value)} required />
        <div className="ih-authform__row">
          <Input label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input
            label="Telefone / WhatsApp"
            type="tel"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            required
          />
        </div>
        <Input
          label="Senha de acesso"
          type="password"
          hint="Você usará esta senha para entrar no sistema."
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          minLength={8}
          required
        />
        <div className="ih-authform__row">
          <div className="ih-field">
            <label className="ih-field__label" htmlFor="curso">
              Curso
            </label>
            <select
              id="curso"
              className="ih-field__input"
              value={idCurso}
              onChange={(e) => setIdCurso(Number(e.target.value))}
              required
            >
              <option value="" disabled>
                Selecione
              </option>
              {cursos.map((curso) => (
                <option key={curso.id_curso} value={curso.id_curso}>
                  {curso.nome}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Semestre"
            type="number"
            min={1}
            max={12}
            value={semestre}
            onChange={(e) => setSemestre(e.target.value)}
            required
          />
        </div>

        <p className="ih-authform__section-title">Colegas de equipe (opcional)</p>
        <p className="ih-authform__hint-secao">
          O e-mail de cada colega é usado para criar a conta dele automaticamente — sem precisar de RA.
        </p>
        {integrantes.map((integrante, indice) => (
          <div className="ih-authform__integrante" key={indice}>
            <Input
              label="Nome"
              value={integrante.nome}
              onChange={(e) => atualizarIntegrante(indice, "nome", e.target.value)}
            />
            <Input
              label="E-mail"
              type="email"
              value={integrante.email}
              onChange={(e) => atualizarIntegrante(indice, "email", e.target.value)}
            />
            <Input
              label="Curso"
              value={integrante.curso}
              onChange={(e) => atualizarIntegrante(indice, "curso", e.target.value)}
            />
            <button
              type="button"
              className="ih-authform__remover"
              onClick={() => removerIntegrante(indice)}
              aria-label="Remover integrante"
            >
              ×
            </button>
          </div>
        ))}
        <Button type="button" variant="secondary" onClick={adicionarIntegrante}>
          + Adicionar integrante
        </Button>

        <p className="ih-authform__section-title">Sobre a ideia</p>
        <Input label="Nome da ideia / projeto" value={nomeIdeia} onChange={(e) => setNomeIdeia(e.target.value)} required />
        <div className="ih-field">
          <label className="ih-field__label" htmlFor="descricao">
            Descrição inicial (pode ser um esboço, mesmo que ainda crua)
          </label>
          <textarea
            id="descricao"
            className="ih-field__input"
            value={descricaoIdeia}
            onChange={(e) => setDescricaoIdeia(e.target.value)}
            required
          />
        </div>
        <div className="ih-authform__row">
          <div className="ih-field">
            <label className="ih-field__label" htmlFor="area">
              Área / setor
            </label>
            <select
              id="area"
              className="ih-field__input"
              value={areaIdeia}
              onChange={(e) => setAreaIdeia(e.target.value as AreaIdeia)}
              required
            >
              <option value="" disabled>
                Selecione
              </option>
              {AREAS.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>
          <div className="ih-field">
            <label className="ih-field__label" htmlFor="estagio">
              Estágio atual
            </label>
            <select
              id="estagio"
              className="ih-field__input"
              value={estagioIdeia}
              onChange={(e) => setEstagioIdeia(e.target.value as EstagioIdeia)}
              required
            >
              <option value="" disabled>
                Selecione
              </option>
              {ESTAGIOS.map((estagio) => (
                <option key={estagio} value={estagio}>
                  {estagio}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="ih-field">
          <label className="ih-field__label" htmlFor="origem">
            Como conheceu o InfoHub? (opcional)
          </label>
          <select
            id="origem"
            className="ih-field__input"
            value={comoConheceu}
            onChange={(e) => setComoConheceu(e.target.value as ComoConheceu)}
          >
            <option value="">Prefiro não informar</option>
            {ORIGENS.map((origem) => (
              <option key={origem} value={origem}>
                {origem}
              </option>
            ))}
          </select>
        </div>

        {erro ? <p className="ih-authform__erro" role="alert">{erro}</p> : null}

        <Button type="submit" fullWidth loading={enviando}>
          Enviar minha ideia
        </Button>

        <div className="ih-authform__links">
          <Link to="/login">Já tenho conta — entrar</Link>
        </div>
      </form>
    </AuthLayout>
  );
}
