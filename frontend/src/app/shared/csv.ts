/**
 * Gera um arquivo .csv (abre direto no Excel) e dispara o download no navegador.
 * Usado pelos botões "Exportar" e "Gerar relatório" de todas as telas.
 */
export function baixarCsv(nome: string, colunas: string[], linhas: (string | number | boolean | null | undefined)[][]): void {
  const texto = [colunas, ...linhas]
    .map(linha => linha.map(valor => '"' + String(valor ?? '').replace(/"/g, '""') + '"').join(';'))
    .join('\r\n');
  const blob = new Blob(['﻿' + texto], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `jb-moda-${nome}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
