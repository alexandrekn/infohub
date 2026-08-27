import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { authServiceMock } from "@/services/mock/authService.mock";
import "./AuthForm.css";

export function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setEnviando(true);
    await authServiceMock.solicitarRecuperacaoSenha(email);
    setEnviando(false);
    setEnviado(true);
  }

  return (
    <AuthLayout
      painelTitulo="Sem acesso à conta? A gente resolve rápido."
      painelTexto="Informe o e-mail cadastrado e enviaremos um link para redefinir sua senha."
    >
      <form className="ih-authform" onSubmit={handleSubmit}>
        <div className="ih-authform__header">
          <h2>Recuperar senha</h2>
          <p>Enviamos um link de redefinição para o e-mail informado.</p>
        </div>

        {enviado ? (
          <p className="ih-authform__sucesso" role="status">
            Se {email} estiver cadastrado, você vai receber um e-mail com as instruções em instantes.
          </p>
        ) : (
          <>
            <Input
              label="E-mail cadastrado"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" fullWidth loading={enviando}>
              Enviar link de recuperação
            </Button>
          </>
        )}

        <div className="ih-authform__links">
          <Link to="/login">Voltar para o login</Link>
        </div>
      </form>
    </AuthLayout>
  );
}
