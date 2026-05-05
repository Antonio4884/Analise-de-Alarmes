"use client";

import React, { useState } from "react";

function gerarCarimbo(texto) {
  try {
    const textoLimpo = texto.replace(/<!--.*?-->/g, "");
    const partes = textoLimpo
      .split("\t")
      .map((p) => p.trim())
      .filter((p) => p);

    if (partes.length < 5) {
      return "Formato inválido. Cole uma linha de alarme válida.";
    }

    const dataHora = partes[1];
    const equipamento = partes[2];
    const alarme = partes[3];
    const ip = partes[4];

    return `.-:CARIMBO DE ABERTURA - NOC:-.

Falha: ${alarme}

Equipamento: ${equipamento}

Alarme: ${alarme}

Data/Hora: ${dataHora}

IP: ${ip}

Interface: N/A`;
  } catch {
    return "Erro ao processar o alarme.";
  }
}

function analisarAlarmes(texto) {
  const linhas = texto.split("\n");
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

  return resultado;
}

export default function App() {
  const [entrada, setEntrada] = useState("");
  const [saida, setSaida] = useState("");

  function processarCarimbo() {
    setSaida(gerarCarimbo(entrada));
  }

  function processarAnalise() {
    setSaida(analisarAlarmes(entrada));
  }

  function limpar() {
    setEntrada("");
    setSaida("");
  }

  async function copiar() {
    if (saida) {
      await navigator.clipboard.writeText(saida);
      alert("Resultado copiado!");
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f1f5f9",
        padding: 24,
        fontFamily: "Arial",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          background: "white",
          padding: 24,
          borderRadius: 16,
          boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
        }}
      >
        <h1 style={{ marginBottom: 20, color: "#000" }}>
          📄 NOC Toolkit
        </h1>

        <textarea
          value={entrada}
          onChange={(e) => setEntrada(e.target.value)}
          placeholder="Cole aqui alarmes ou linha bruta"
          style={{
            width: "100%",
            height: 180,
            padding: 12,
            borderRadius: 8,
            border: "1px solid #ccc",
            marginBottom: 16,
            fontFamily: "monospace",
          }}
        />

        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          <button onClick={processarCarimbo}>
            Gerar Carimbo
          </button>

          <button onClick={processarAnalise}>
            Analisar Alarmes
          </button>

          <button onClick={copiar}>
            📋 Copiar
          </button>

          <button onClick={limpar}>
            🗑️ Limpar
          </button>
        </div>

        <textarea
          value={saida}
          readOnly
          placeholder="Resultado aparecerá aqui"
          style={{
            width: "100%",
            height: 420,
            padding: 12,
            borderRadius: 8,
            border: "1px solid #ccc",
            background: "#000",
            color: "#00ff88",
            fontFamily: "monospace",
          }}
        />
      </div>
    </div>
  );
}
