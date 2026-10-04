/**
 * exporters.js - Exportação de relatórios
 * Fornece funções para exportar dados em diferentes formatos
 */

import { formatBRL, formatPct } from './formatters.js';

class ReportExporter {
  /**
   * Exporta para CSV
   */
  static exportToCSV(results, state) {
    const lines = [];

    // Cabeçalho
    lines.push('SIMULADOR TRIBUTÁRIO E DE CUSTOS');
    lines.push(`Data: ${new Date().toLocaleDateString('pt-BR')}`);
    lines.push('');

    // Receita
    lines.push('RECEITA');
    lines.push(`Receita Mensal,${formatBRL(results.receita)}`);
    lines.push(`Receita Acumulada 12 meses,${formatBRL(results.rbt12)}`);
    lines.push('');

    const revenueBase = results.revenueBase ?? {
      origem: 'manual',
      projection: null,
      receitas12m: state.receitas12m
    };
    lines.push(`Origem da base,${revenueBase.origem}`);
    if (revenueBase.projection) {
      lines.push('PROJEÇÃO FINANCEIRA — ANO 1');
      lines.push('Mês,Novos Clientes,Clientes Pagando Mensalidade,Faturamento Setup,Faturamento Mensal,Faturamento Total');
      revenueBase.projection.forEach((month) => {
        lines.push([
          `Mês ${month.mes}`,
          month.novosClientes,
          month.clientesPagandoMensalidade,
          formatBRL(month.faturamentoSetup),
          formatBRL(month.faturamentoMensal),
          formatBRL(month.total)
        ].join(','));
      });
    } else {
      lines.push('HISTÓRICO MANUAL — 12 MESES');
      lines.push('Mês,Receita');
      revenueBase.receitas12m.forEach((value, index) => {
        lines.push([`Mês ${index + 1}`, formatBRL(value)].join(','));
      });
    }
    lines.push('');

    // Fator R
    lines.push('FATOR R');
    lines.push(`Fator R,${formatPct(results.fatorR)}`);
    lines.push(`Anexo Aplicado,${results.anexo}`);
    lines.push('');

    // DAS
    lines.push('SIMPLES NACIONAL (DAS)');
    lines.push(`DAS Mensal,${formatBRL(results.das)}`);
    if (results.aliquotaEfetiva !== null) {
      lines.push(`Alíquota Efetiva,${formatPct(results.aliquotaEfetiva)}`);
    }
    lines.push('');

    // Sócio
    lines.push('PRÓ-LABORE DO SÓCIO');
    lines.push(`Pró-labore,${formatBRL(state.prolabore)}`);
    lines.push(`INSS Sócio,${formatBRL(results.socio.inssSocio)}`);
    lines.push(`IRPF Sócio,${formatBRL(results.socio.irpf)}`);
    lines.push(`Custo Patronal,${formatBRL(results.socio.custoPatronal)}`);
    lines.push(`Custo Total Sócio,${formatBRL(results.socio.totalSocio)}`);
    lines.push('');

    // CLT
    lines.push('FUNCIONÁRIOS CLT');
    lines.push(`Quantidade,${state.funcionarios.length}`);
    lines.push(`Custo Total CLT,${formatBRL(results.clt.totalCost)}`);
    lines.push(`Encargos CLT,${formatBRL(results.clt.totalCharges)}`);
    lines.push('');

    // CT
    lines.push('PRESTADORES CT (PJ/AUTÔNOMOS)');
    lines.push(`Quantidade,${state.contratosCT.length}`);
    lines.push(`Base contratual CT,${formatBRL(results.ct.baseTotal)}`);
    lines.push(`ISS CT,${formatBRL(results.ct.issTotal)}`);
    lines.push(`Outras retenções CT,${formatBRL(results.ct.outrasRetencoesTotal)}`);
    lines.push(`Tributos CT (total),${formatBRL(results.ct.tributosTotal)}`);
    lines.push(`Custo Total CT (com tributos),${formatBRL(results.ct.custoTotal)}`);
    lines.push('');

    // Custos Variáveis
    lines.push('CUSTOS VARIÁVEIS');
    lines.push(`Total,${formatBRL(results.variaveis.total)}`);
    lines.push(`Percentual da Receita,${formatPct(results.variaveis.perc)}`);
    lines.push('');

    // Consolidação
    lines.push('CONSOLIDAÇÃO');
    lines.push(`Carga Tributária Total,${formatBRL(results.cargaTributaria)}`);
    lines.push(`Custo de Operação,${formatBRL(results.custoOperacao)}`);
    lines.push(`Total de Despesas,${formatBRL(results.totalDespesas)}`);
    lines.push('Composição das despesas,DAS + custo de operação (já com tributos CT) + custos variáveis');
    lines.push('');

    // Indicadores
    const percCarga = results.receita > 0 ? (results.cargaTributaria / results.receita) : 0;
    const percCustoOp = results.receita > 0 ? (results.custoOperacao / results.receita) : 0;
    const percDespesas = results.receita > 0 ? (results.totalDespesas / results.receita) : 0;

    lines.push('INDICADORES (% da Receita)');
    lines.push(`Carga Tributária,${formatPct(percCarga)}`);
    lines.push(`Custo de Operação,${formatPct(percCustoOp)}`);
    lines.push(`Total de Despesas,${formatPct(percDespesas)}`);

    return lines.join('\n');
  }

  /**
   * Exporta para JSON
   */
  static exportToJSON(results, state) {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      results,
      state
    }, null, 2);
  }

  /**
   * Exporta para HTML (para visualização ou impressão)
   */
  static exportToHTML(results, state) {
    const revenueBase = results.revenueBase ?? {
      origem: 'manual',
      projection: null,
      receitas12m: state.receitas12m
    };
    const revenueRows = revenueBase.projection
      ? revenueBase.projection.map((month) => `
    <tr>
      <td>Mês ${month.mes}</td>
      <td>${month.novosClientes}</td>
      <td>${month.clientesPagandoMensalidade}</td>
      <td>${formatBRL(month.faturamentoSetup)}</td>
      <td>${formatBRL(month.faturamentoMensal)}</td>
      <td><strong>${formatBRL(month.total)}</strong></td>
    </tr>`).join('')
      : revenueBase.receitas12m.map((value, index) => `
    <tr>
      <td>Mês ${index + 1}</td>
      <td colspan="4">Histórico manual</td>
      <td><strong>${formatBRL(value)}</strong></td>
    </tr>`).join('');
    const revenueHeaders = revenueBase.projection
      ? '<th>Mês</th><th>Novos clientes</th><th>Clientes pagando</th><th>Setup</th><th>Mensalidade</th><th>Total</th>'
      : '<th>Mês</th><th colspan="4">Origem</th><th>Receita</th>';
    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório - Simulador Tributário</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      color: #333;
      line-height: 1.6;
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2 { color: #0066cc; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 10px;
      text-align: left;
    }
    th {
      background-color: #f0f0f0;
      font-weight: bold;
    }
    .total-row {
      background-color: #f9f9f9;
      font-weight: bold;
    }
    .highlight {
      background-color: #fffacd;
    }
    .footer {
      margin-top: 30px;
      font-size: 12px;
      color: #666;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <h1>Relatório - Simulador Tributário e de Custos</h1>
  <p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')} | <strong>Hora:</strong> ${new Date().toLocaleTimeString('pt-BR')}</p>

  <h2>Receita</h2>
  <table>
    <tr>
      <td>Receita Mensal</td>
      <td>${formatBRL(results.receita)}</td>
    </tr>
    <tr>
      <td>Receita Acumulada 12 meses</td>
      <td>${formatBRL(results.rbt12)}</td>
    </tr>
  </table>

  <h2>Base de receita — ${revenueBase.origem === 'projecao' ? 'Projeção financeira — Ano 1' : 'Histórico manual — 12 meses'}</h2>
  <p><strong>Origem usada no Fator R:</strong> ${revenueBase.origem}</p>
  <table>
    <tr>${revenueHeaders}</tr>
    ${revenueRows}
  </table>

  <h2>Fator R</h2>
  <table>
    <tr>
      <td>Fator R</td>
      <td>${formatPct(results.fatorR)}</td>
    </tr>
    <tr>
      <td>Anexo Aplicado</td>
      <td><strong>${results.anexo}</strong></td>
    </tr>
  </table>

  <h2>Simples Nacional (DAS)</h2>
  <table>
    <tr>
      <td>DAS Mensal</td>
      <td>${formatBRL(results.das)}</td>
    </tr>
    ${results.aliquotaEfetiva !== null ? `
    <tr>
      <td>Alíquota Efetiva</td>
      <td>${formatPct(results.aliquotaEfetiva)}</td>
    </tr>
    ` : ''}
  </table>

  <h2>Pró-labore do Sócio</h2>
  <table>
    <tr>
      <td>Pró-labore</td>
      <td>${formatBRL(state.prolabore)}</td>
    </tr>
    <tr>
      <td>INSS Sócio</td>
      <td>${formatBRL(results.socio.inssSocio)}</td>
    </tr>
    <tr>
      <td>IRPF Sócio</td>
      <td>${formatBRL(results.socio.irpf)}</td>
    </tr>
    <tr>
      <td>Custo Patronal</td>
      <td>${formatBRL(results.socio.custoPatronal)}</td>
    </tr>
    <tr class="total-row">
      <td>Custo Total Sócio</td>
      <td>${formatBRL(results.socio.totalSocio)}</td>
    </tr>
  </table>

  <h2>Funcionários CLT</h2>
  <table>
    <tr>
      <td>Quantidade</td>
      <td>${state.funcionarios.length}</td>
    </tr>
    <tr>
      <td>Custo Total CLT</td>
      <td>${formatBRL(results.clt.totalCost)}</td>
    </tr>
    <tr>
      <td>Encargos</td>
      <td>${formatBRL(results.clt.totalCharges)}</td>
    </tr>
  </table>

  <h2>Prestadores CT</h2>
  <table>
    <tr>
      <td>Quantidade</td>
      <td>${state.contratosCT.length}</td>
    </tr>
    <tr>
      <td>Base contratual CT</td>
      <td>${formatBRL(results.ct.baseTotal)}</td>
    </tr>
    <tr>
      <td>ISS CT</td>
      <td>${formatBRL(results.ct.issTotal)}</td>
    </tr>
    <tr>
      <td>Outras retenções CT</td>
      <td>${formatBRL(results.ct.outrasRetencoesTotal)}</td>
    </tr>
    <tr>
      <td>Tributos CT (total)</td>
      <td>${formatBRL(results.ct.tributosTotal)}</td>
    </tr>
    <tr class="total-row">
      <td>Custo Total CT (com tributos)</td>
      <td>${formatBRL(results.ct.custoTotal)}</td>
    </tr>
  </table>

  <h2>Custos Variáveis</h2>
  <table>
    <tr>
      <td>Total</td>
      <td>${formatBRL(results.variaveis.total)}</td>
    </tr>
    <tr>
      <td>Percentual da Receita</td>
      <td>${formatPct(results.variaveis.perc)}</td>
    </tr>
  </table>

  <h2>Consolidação</h2>
  <table>
    <tr class="highlight">
      <td>Carga Tributária Total</td>
      <td>${formatBRL(results.cargaTributaria)}</td>
    </tr>
    <tr>
      <td>Custo de Operação</td>
      <td>${formatBRL(results.custoOperacao)}</td>
    </tr>
    <tr class="total-row highlight">
      <td>Total de Despesas</td>
      <td>${formatBRL(results.totalDespesas)}</td>
    </tr>
  </table>
  <p><strong>Composição das despesas:</strong> DAS + custo de operação (que já contém os tributos CT) + custos variáveis. A carga tributária é uma visão de composição e não é somada novamente.</p>

  <h2>Indicadores (% da Receita)</h2>
  <table>
    <tr>
      <td>Carga Tributária</td>
      <td>${formatPct(results.receita > 0 ? (results.cargaTributaria / results.receita) : 0)}</td>
    </tr>
    <tr>
      <td>Custo de Operação</td>
      <td>${formatPct(results.receita > 0 ? (results.custoOperacao / results.receita) : 0)}</td>
    </tr>
    <tr>
      <td>Total de Despesas</td>
      <td>${formatPct(results.receita > 0 ? (results.totalDespesas / results.receita) : 0)}</td>
    </tr>
  </table>

  <div class="footer">
    <p>Este relatório foi gerado automaticamente pelo Simulador Tributário e de Custos.</p>
    <p>Consulte um contador ou consultor tributário para validação e orientações específicas.</p>
  </div>
</body>
</html>
    `;
    return html;
  }

  /**
   * Faz download de um arquivo
   */
  static downloadFile(content, filename, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Exporta e faz download em CSV
   */
  static downloadCSV(results, state) {
    const csv = this.exportToCSV(results, state);
    const filename = `simulador_${new Date().toISOString().split('T')[0]}.csv`;
    this.downloadFile(csv, filename, 'text/csv;charset=utf-8;');
  }

  /**
   * Exporta e faz download em JSON
   */
  static downloadJSON(results, state) {
    const json = this.exportToJSON(results, state);
    const filename = `simulador_${new Date().toISOString().split('T')[0]}.json`;
    this.downloadFile(json, filename, 'application/json');
  }

  /**
   * Exporta e faz download em HTML
   */
  static downloadHTML(results, state) {
    const html = this.exportToHTML(results, state);
    const filename = `simulador_${new Date().toISOString().split('T')[0]}.html`;
    this.downloadFile(html, filename, 'text/html;charset=utf-8;');
  }
}

export default ReportExporter;
