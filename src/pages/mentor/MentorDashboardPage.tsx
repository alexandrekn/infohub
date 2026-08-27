import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EquipeCard } from "@/components/equipes/EquipeCard";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/hooks/useAuth";
import { dataServiceMock } from "@/services/mock/dataService.mock";
import type { Equipe } from "@/types";
import logoIcon from "@/assets/logo-infohub-icon.png";
import "./MentorDashboardPage.css";

export function MentorDashboardPage() {
  const { usuario } = useAuth();
  const [equipes, setEquipes] = useState<Equipe[]>([]);

  useEffect(() => {
    if (!usuario) return;
    dataServiceMock.listarEquipesDoMentor(usuario.id_usuario).then(setEquipes);
  }, [usuario]);

  return (
    <DashboardLayout titulo="Minhas equipes">
      {equipes.length === 0 ? (
        <Card className="ih-mentor__vazio">
          <img src={logoIcon} alt="" className="ih-mentor__vazio-icone" aria-hidden />
          <p>Você ainda não está mentorando nenhuma equipe.</p>
        </Card>
      ) : (
        <div className="ih-mentor__grid">
          {equipes.map((equipe) => (
            <EquipeCard key={equipe.id_equipe} equipe={equipe} mentores={usuario ? [usuario] : []} />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
