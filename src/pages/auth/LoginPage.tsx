import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import "./AuthForm.css";

/** Contas seedadas no backend (src/data/store.ts) — todas com senha "senha123". */
const CONTAS_TESTE = [
  { perfil: "Admin", email: "bruna.admin@infohub.edu.br" },
  { perfil: "Mentor", email: "rafael.mentor@infohub.edu.br" },
  { perfil: "Aluno (líder)", email: "gustavo@aluno.edu.br" },
  { perfil: "Aluno (integrante)", email: "larissa@aluno.edu.br" },
] as const;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await login(email, senha);
      const destino = (location.state as { from?: string })?.from ?? "/";
      navigate(destino, { replace: true });
    } catch {
      setErro("E-mail ou senha inválidos. Confira os dados e tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AuthLayout
      painelTitulo="Do InfoHub ao InovAMF, um passo de cada vez."
      painelTexto="Acompanhe sua ideia, cumpra as tarefas de cada encontro e chegue pronta para a submissão."
    >
      <form className="ih-authform" onSubmit={handleSubmit}>
        <div className="ih-authform__header">
          <h2>Entrar</h2>
          <p>Acesse com o e-mail cadastrado no InfoHub.</p>
        </div>

        <Input
          label="E-mail"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Senha"
          type="password"
          autoComplete="current-password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />

        {erro ? <p className="ih-authform__erro" role="alert">{erro}</p> : null}

        <Button type="submit" fullWidth loading={enviando}>
          Entrar
        </Button>

        <div className="ih-authform__links">
          <Link to="/esqueci-senha">Esqueci minha senha</Link>
          <Link to="/cadastro-ideia">Ainda não tenho conta — enviar minha ideia</Link>
        </div>

        <div className="ih-authform__contas-teste">
          <p>Contas de teste do backend — senha para todas: <strong>senha123</strong></p>
          <ul>
            {CONTAS_TESTE.map((conta) => (
              <li key={conta.email}>
                <button type="button" onClick={() => setEmail(conta.email)}>
                  <strong>{conta.perfil}</strong>
                  <span>{conta.email}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </form>
    </AuthLayout>
  );
}
