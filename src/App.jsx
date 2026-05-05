"use client";
import { useState } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  function analisar() {
    const linhas = input.split("\n");
    const grupos = {};

    linhas.forEach((linha) => {
      if (!linha.trim()) return;

      const partes = linha.split("\t");
      let equipamento = null;

      for (let i = 0; i < partes.length; i++) {
        if (partes[i].includes("BRT") && partes[i + 1]) {
          equipamento = partes[i + 1].trim();
          break;
        }
      }

      if (!equipamento) return;

      let grupo = "OUTROS";

      const parenteses = equipamento.match(/^([A-Za-z0-9]+)\(/);
      if (parenteses) {
        grupo = parenteses[1].toUpperCase();
      } else {
        const prefixo = equipamento.match(/^([a-zA-Z]+\d*)/);
        if (prefixo) grupo = prefixo[1].toUpperCase();
      }

      if (!grupos[grupo]) grupos[grupo] = [];
      grupos[grupo].push(equipamento);
    });

    const totalGrupos = Object.keys(grupos).length;

    let analise = "Possível falha isolada";
    if (totalGrupos >= 4) {
      analise = "Possível falha massiva / backbone / gerência";
    } else if (totalGrupos >= 2) {
      analise = "Possível falha regional";
    }

    let resultado = `Análise: ${analise}\n\n`;

    Object.keys(grupos)
      .sort()
      .forEach((grupo) => {
        const equipamentos = [...new Set(grupos[grupo])].sort();

        resultado += `[${grupo}] (${equipamentos.length})\n`;

        for (let i = 0; i < equipamentos.length; i += 4) {
          resultado +=
            equipamentos
              .slice(i, i + 4)
              .map((e) => e.padEnd(28, " "))
              .join("") + "\n\n";
        }

        resultado += "\n";
      });

    setOutput(resultado);
  }

  return (
    <main style={{ padding: 30, fontFamily: "monospace" }}>
      <h1>Alarm Analyzer</h1>

      <textarea
        rows={20}
        style={{ width: "100%" }}
        placeholder="Cole alarmes aqui"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <button
        onClick={analisar}
        style={{ marginTop: 20, padding: 12 }}
      >
        Analisar
      </button>

      <pre style={{ whiteSpace: "pre-wrap", marginTop: 20 }}>
        {output}
      </pre>
    </main>
  );
}