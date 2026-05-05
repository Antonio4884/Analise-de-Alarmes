"use client";

import React, { useState } from "react";

function gerarCarimbo(texto) {
  try {
    const textoLimpo = texto.replace(/<!--.*?-->/g, "");

    const partes = textoLimpo
      .split(/\t|\n/)
      .map((p) => p.trim())
      .filter(Boolean);

    let equipamento = "";
    let dataHora = "";
    let alarme = "";
    let ip = "";

    const alarmesConhecidos = [
      "DEVICE HAS STOPPED RESPONDING TO POLLS",
      "Communication Failure",
      "The Device is offline",
      "Link down",
      "Link Up",
    ];

    for (const item of partes) {
      // Detecta IP
      if (/^\d{1,3}(\.\d{1,3}){3}$/.test(item)) {
        ip = item;
        continue;
      }

      // Detecta data/hora
      if (
        item.includes("BRT") ||
        /\d{1,2}\sde\s.+\s\d{2}:\d{2}:\d{2}/i.test(item)
      ) {
        dataHora = item;
        continue;
      }

      // Detecta alarmes conhecidos
      if (
        alarmesConhecidos.some((alarmeTxt) =>
          item.toLowerCase().includes(alarmeTxt.toLowerCase())
        )
      ) {
        alarme = item;
        continue;
      }

      // Detecta equipamento
      if (
        !equipamento &&
        item !== "No" &&
        /^[A-Za-z0-9\-_]+(\(.*\))?$/.test(item) &&
        !item.includes("Directly Managed") &&
        !item.includes("EventModel")
      ) {
        equipamento = item;
      }
    }

    return `.-:CARIMBO DE ABERTURA - NOC:-.

Falha: 

Equipamento: ${equipamento || "N/A"}

Alarme: ${alarme || "N/A"}

Data/Hora: ${dataHora || "N/A"}

IP: ${ip || "N/A"}

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

    const partes = linha
      .split("\t")
      .map((p) => p.trim())
      .filter(Boolean);

    let equipamento = null;

    // Formato longo: procura BRT e pega próximo campo
    const indiceBRT = partes.findIndex((p) => p.includes("BRT"));
    if (indiceBRT !== -1 && partes[indiceBRT + 1]) {
      equipamento = partes[indiceBRT + 1];
    }

    // Formato resumido
    if (!equipamento && partes.length >= 2) {
      const candidato = partes[1];

      if (
        /^[A-Za-z0-9\-_]+(\(.*\))?$/.test(candidato) &&
        candidato !== "No"
      ) {
        equipamento = candidato;
      }
    }

    if (!equipamento) return;

    let grupo = "OUTROS";

    // Ex: IGESE(ZXDU...)
    const parenteses = equipamento.match(/^([A-Za-z0-9]+)\(/);
    if (parenteses) {
      grupo = parenteses[1].toUpperCase();
    } else {
      // Ex: sg1-cdo-se
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
    if (!saida) return;

    await navigator.clipboard.writeText(saida);
    alert("Resultado copiado!");
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
        <h1 style={{ marginBottom: 20 }}>📄 NOC Toolkit</h1>

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
          <button onClick={processarCarimbo}>Gerar Carimbo</button>
          <button onClick={processarAnalise}>Analisar Alarmes</button>
          <button onClick={copiar}>📋 Copiar</button>
          <button onClick={limpar}>🗑️ Limpar</button>
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
