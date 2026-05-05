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

      // Caso exemplo: IGESE(ZXDU58...)
      const parenteses = equipamento.match(/^([A-Za-z0-9]+)\(/);
      if (parenteses) {
        grupo = parenteses[1].toUpperCase();
      } else {
        // Caso exemplo: sg1-cdo-se
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

  function limpar() {
    setInput("");
    setOutput("");
  }

  return (
    <main
      style={{
        padding: 30,
        fontFamily: "monospace",
        maxWidth: 1200,
        margin: "0 auto",
      }}
    >
      <h1>Alarm Analyzer</h1>

      <textarea
        rows={20}
        style={{
          width: "100%",
          padding: 12,
          fontFamily: "monospace",
          fontSize: 14,
        }}
        placeholder="Cole os alarmes aqui..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
        <button
          onClick={analisar}
          style={{
            padding: 12,
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Analisar
        </button>

        <button
          onClick={limpar}
          style={{
            padding: 12,
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Limpar
        </button>
      </div>

      <pre
        style={{
          whiteSpace: "pre-wrap",
          marginTop: 20,
          padding: 20,
          background: "#111",
          color: "#00ff88",
          borderRadius: 8,
          overflowX: "auto",
        }}
      >
        {output}
      </pre>
    </main>
  );
}
