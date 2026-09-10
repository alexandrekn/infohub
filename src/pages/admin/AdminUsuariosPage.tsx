import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { dataService } from "@/services/data.service";
import type { PerfilUsuario, Usuario } from "@/types";
import "./AdminUsuariosPage.css";

export function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [mostrarForm, setMostrarForm] = useState(false);

  async function recarregar() {
    const lista = await dataService.listarUsuariosPorPerfil(["admin", "mentor"]);
    setUsuarios(lista);
  }

  useEffect(() => {
    recarregar();
  }, []);

  async function alternarAtivo(idUsuario: number) {
    await dataService.alternarAtivoUsuario(idUsuario);
    recarregar();
  }

  return (
    <DashboardLayout titulo="Usuários">
      <div className="ih-usuarios__cabecalho">
        <p className="ih-usuarios__legenda">Contas de administrador e mentor — RF-03.</p>
        <Button variant="secondary" onClick={() => setMostrarForm((v) => !v)}>
          {mostrarForm ? "Cancelar" : "+ Nova conta"}
        </Button>
      </div>

      {mostrarForm && (
        <NovaContaForm
          onCriada={() => {
            setMostrarForm(false);
            recarregar();
          }}
        />
      )}

      <Card className="ih-usuarios__lista">
        <table className="ih-tabela">
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Perfil</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario) => (
              <tr key={usuario.id_usuario}>
                <td>
                  <strong>{usuario.nome}</strong>
                </td>
                <td>{usuario.email}</td>
                <td>
                  <Badge tom={usuario.perfil === "admin" ? "info" : "neutro"}>
                    {usuario.perfil === "admin" ? "Administrador" : "Mentor"}
                  </Badge>
                </td>
                <td>
                  <Badge tom={usuario.ativo === false ? "erro" : "sucesso"}>
                    {usuario.ativo === false ? "Inativo" : "Ativo"}
                  </Badge>
                </td>
                <td>
                  <button className="ih-usuarios__toggle" onClick={() => alternarAtivo(usuario.id_usuario)}>
                    {usuario.ativo === false ? "Reativar" : "Desativar"}
                  </button>
                </td>
              </tr>
            ))}
            {usuarios.length === 0 && (
              <tr>
                <td colSpan={5} className="ih-tabela__vazio">
                  Nenhuma conta cadastrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </DashboardLayout>
  );
}

function NovaContaForm({ onCriada }: { onCriada: () => void }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [perfil, setPerfil] = useState<PerfilUsuario>("mentor");
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim() || !email.trim()) return;
    setEnviando(true);
    await dataService.criarUsuario({ nome, email, telefone, perfil });
    setEnviando(false);
    setNome("");
    setEmail("");
    setTelefone("");
    onCriada();
  }

  return (
    <Card className="ih-usuarios__form-card">
      <form className="ih-usuarios__form" onSubmit={handleSubmit}>
        <Input label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
        <Input label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input label="Telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
        <div className="ih-field">
          <label className="ih-field__label" htmlFor="perfil-nova-conta">
            Perfil
          </label>
          <select
            id="perfil-nova-conta"
            className="ih-field__input"
            value={perfil}
            onChange={(e) => setPerfil(e.target.value as PerfilUsuario)}
          >
            <option value="mentor">Mentor</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
        <Button type="submit" loading={enviando}>
          Criar conta
        </Button>
      </form>
    </Card>
  );
}
