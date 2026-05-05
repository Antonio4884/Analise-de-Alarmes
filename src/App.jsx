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

    // FORMATO 1: antigo (BRT e equipamento depois)
    const indiceBRT = partes.findIndex((p) => p.includes("BRT"));
    if (indiceBRT !== -1 && partes[indiceBRT + 1]) {
      equipamento = partes[indiceBRT + 1];
    }

    // FORMATO 2: resumido
    // Ex: No | car1-czi-se | DEVICE HAS STOPPED...
    if (!equipamento && partes.length >= 3) {
      const candidato = partes[1];

      const pareceEquipamento =
        /^[a-zA-Z0-9\-]+\(?/.test(candidato) &&
        !candidato.includes("DEVICE") &&
        !candidato.includes("Communication");

      if (pareceEquipamento) {
        equipamento = candidato;
      }
    }

    if (!equipamento) return;

    let grupo = "OUTROS";

    // Ex: IGESE(ZXDU58...)
    const parenteses = equipamento.match(/^([A-Za-z0-9]+)\(/);
    if (parenteses) {
      grupo = parenteses[1].toUpperCase();
    } else {
      // Ex: car1-czi-se
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
