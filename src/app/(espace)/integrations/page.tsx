import { Apparition } from "@/components/apparition";
import { origine, exigerSession } from "@/lib/serveur";
import { listeOutils } from "@/mcp/protocole";
import { Cle } from "./cle";

export const metadata = { title: "Intégrations" };

export default async function Integrations() {
  await exigerSession();
  const url = `${await origine()}/api/mcp`;
  const outils = listeOutils();
  const blocs = [
    { titre: "Claude Code", code: `claude mcp add --transport http sillage ${url} \\\n  --header "Authorization: Bearer $SILLAGE_CLE"` },
    { titre: "Claude Desktop, Cursor… (via mcp-remote)", code: JSON.stringify({ mcpServers: { sillage: { command: "npx", args: ["-y", "mcp-remote", url, "--header", "Authorization: Bearer ${SILLAGE_CLE}"] } } }, null, 2) },
    { titre: "n8n, scripts, tout client HTTP", code: `curl -s ${url} \\\n  -H "Authorization: Bearer $SILLAGE_CLE" -H "Content-Type: application/json" \\\n  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"sillage_tableau","arguments":{}}}'` },
  ];
  return (
    <div className="space-y-6">
      <Apparition>
        <h1 className="titre-display text-4xl sm:text-5xl">Intégrations</h1>
        <p className="mt-2 max-w-2xl text-discret">
          Sillage parle le Model Context Protocol. Branchez n&apos;importe quel agent : il travaillera avec les mêmes règles que vous — schémas validés,
          transitions contrôlées, historique horodaté.
        </p>
      </Apparition>
      <Apparition delai={0.05} className="carte p-6">
        <h2 className="font-medium">Votre clé</h2>
        <p className="mb-4 mt-1 text-sm text-discret">Une clé donne accès à votre espace et à lui seul. Rangez-la comme un mot de passe (variable d&apos;environnement SILLAGE_CLE).</p>
        <Cle />
      </Apparition>
      <div className="grid gap-4 lg:grid-cols-3">
        {blocs.map((b, i) => (
          <Apparition key={b.titre} delai={0.08 + i * 0.04} className="carte min-w-0 p-5">
            <h2 className="text-sm font-medium">{b.titre}</h2>
            <pre className="mt-3 overflow-x-auto rounded-xl border border-ligne bg-fond p-4 font-mono text-[12px] leading-relaxed text-discret">
              <code>{b.code}</code>
            </pre>
          </Apparition>
        ))}
      </div>
      <Apparition delai={0.12} className="carte p-6">
        <h2 className="font-medium">{outils.length} outils exposés</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {outils.map((o) => (
            <li key={o.name} className="rounded-xl border border-ligne p-4">
              <p className="font-mono text-sm text-ecume">{o.name}</p>
              <p className="mt-1 text-sm text-discret">{o.description}</p>
            </li>
          ))}
        </ul>
      </Apparition>
    </div>
  );
}
