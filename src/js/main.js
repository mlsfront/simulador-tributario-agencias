/**
 * main.js - Ponto de entrada da aplicação
 * Orquestra todos os módulos e inicializa a aplicação
 */

import State from './models/State.js';
import TaxCalculator from './models/TaxCalculator.js';
import PricingCalculator from './models/PricingCalculator.js';
import ReportExporter from './utils/exporters.js';
import { attachMasks, getNum, getPctNum, parseBRL, parsePct, formatBRL, formatPct, formatIndicator } from './utils/formatters.js';


// Instâncias globais
let state = new State();
let calculator = null;
let saveTimer = null;
let chartCarga = null;
let chartCustos = null;

const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#039;'
}[char]));

const formatStorageDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleString('pt-BR');
};

function updateStorageStatus(message = null) {
  const status = document.getElementById('storageStatus');
  if (!status) return;

  if (message) {
    status.textContent = message;
    return;
  }

  const metadata = state.getStorageMetadata();
  const savedAt = formatStorageDate(metadata?.savedAt);
  if (!savedAt) {
    status.textContent = state.state.storage?.autoSave
      ? 'Autosalvamento ativo. Nenhum estado salvo ainda.'
      : 'Autosalvamento desativado. Nenhum estado salvo nesta sessão.';
    return;
  }

  status.textContent = `${state.state.storage?.autoSave ? 'Autosalvamento ativo' : 'Autosalvamento desativado'} · Último salvamento: ${savedAt}`;
}

/**
 * Inicializa a aplicação
 */
function init() {
  // Carrega dados do localStorage
  if (!state.loadFromStorage()) {
    // Dados padrão se não houver localStorage
    state.state.funcionarios = [
      { nome: 'Designer Pleno', salario: 4000, beneficios: 600 },
      { nome: 'Dev Frontend', salario: 5000, beneficios: 700 }
    ];
    state.state.contratosCT = [{ descricao: 'Redator PJ', valor: 2500 }];
    state.state.custosVariaveis = [{ descricao: 'ChatGPT / Copilot', valor: 250 }];
  }

  calculator = new TaxCalculator(state.state);

  // Aplica UI inicial
  applyStateToUI();
  attachMasks();
  wireEvents();
  calcAll();


}

/**
 * Aplica o estado para a UI
 */
function applyStateToUI() {
  const s = state.state;

  // Receita
  document.getElementById('receitaMensal').value = formatBRL(s.receitaMensal);
  document.getElementById('receitaMensal').dataset.num = s.receitaMensal;

  // Pró-labore
  document.getElementById('prolabore').value = formatBRL(s.prolabore);
  document.getElementById('prolabore').dataset.num = s.prolabore;

  document.getElementById('tetoINSS').value = formatBRL(s.tetoINSS);
  document.getElementById('tetoINSS').dataset.num = s.tetoINSS;

  // Alíquotas
  Object.entries(s.aliquotas).forEach(([key, value]) => {
    const el = document.getElementById(key);
    if (el) {
      el.value = formatPct(value);
      el.dataset.num = value;
    }
  });

  // Modo avançado
  document.getElementById('modoAvancadoSimples').checked = s.modoAvancado;
  document.getElementById('simplesBasico').style.display = s.modoAvancado ? 'none' : 'block';
  document.getElementById('simplesAvancado').style.display = s.modoAvancado ? 'block' : 'none';

  // Renderiza listas
  renderFuncionarios();
  renderCT();
  renderVariaveis();
  drawRevenueHistory();
  renderRevenueProjection();
  syncProjectionSettingsToModal();
  drawTabela('tabelaIII', s.tabelaIII, 'III');
  drawTabela('tabelaV', s.tabelaV, 'V');
  drawTabela('tabelaIRPF', s.tabelaIRPF, 'IRPF');
}

/**
 * Renderiza histórico de receitas
 */
function drawRevenueHistory() {
  const grid = document.getElementById('revenueHistoryGrid');
  if (!grid) return;
  grid.innerHTML = '';

  const meses = ['Mês -11', 'Mês -10', 'Mês -9', 'Mês -8', 'Mês -7', 'Mês -6', 'Mês -5', 'Mês -4', 'Mês -3', 'Mês -2', 'Mês -1', 'Mês Atual'];

  state.state.receitas12m.forEach((val, i) => {
    const div = document.createElement('div');
    div.innerHTML = `<label>${meses[i]}</label><input type="text" data-mask="currency" value="${formatBRL(val)}">`;
    grid.appendChild(div);

    const input = div.querySelector('input');
    input.addEventListener('blur', (e) => {
      const newVal = parseBRL(e.target.value);
      state.state.receitas12m[i] = newVal;
      state.state.projecaoFinanceira.ativa = false;
      const projectionToggle = document.getElementById('modal_projecaoAtiva');
      if (projectionToggle) projectionToggle.checked = false;
      if (i === 11) {
        const mEl = document.getElementById('receitaMensal');
        if (mEl) {
          mEl.value = formatBRL(newVal);
          mEl.dataset.num = newVal;
        }
      }
      calcAll();
    });
  });

  attachMasks();
}

/**
 * Renderiza o cronograma financeiro projetado.
 */
function renderRevenueProjection() {
  const tbody = document.querySelector('#revenueProjectionTable tbody');
  if (!tbody) return;

  const config = state.state.projecaoFinanceira;
  const projection = state.getRevenueProjection(config);
  const totalNewClients = projection.reduce((sum, month) => sum + month.novosClientes, 0);
  const totalSetup = projection.reduce((sum, month) => sum + month.faturamentoSetup, 0);
  const totalRecurring = projection.reduce((sum, month) => sum + month.faturamentoMensal, 0);
  const totalRevenue = projection.reduce((sum, month) => sum + month.total, 0);

  tbody.innerHTML = projection.map((month) => `
    <tr class="${month.mes === config.mesReferencia ? 'is-reference' : ''}">
      <td>Mês ${month.mes}${month.mes === config.mesReferencia ? ' <span class="projection-badge">Atual</span>' : ''}</td>
      <td>${month.novosClientes}</td>
      <td>${month.clientesPagandoMensalidade}</td>
      <td>${formatBRL(month.faturamentoSetup)}</td>
      <td>${formatBRL(month.faturamentoMensal)}</td>
      <td><strong>${formatBRL(month.total)}</strong></td>
    </tr>
  `).join('');

  const setText = (id, value) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  };

  setText('projectionTotalNewClients', totalNewClients);
  setText('projectionTotalSetup', formatBRL(totalSetup));
  setText('projectionTotalRecurring', formatBRL(totalRecurring));
  setText('projectionTotalRevenue', formatBRL(totalRevenue));

  const status = document.getElementById('projectionStatus');
  if (status) {
    status.textContent = config.ativa
      ? `Projeção ativa. A receita mensal atual usa o Mês ${config.mesReferencia}: ${formatBRL(projection[config.mesReferencia - 1].total)}.`
      : 'Projeção configurada, mas o histórico manual está ativo e não será substituído.';
  }
}

function syncProjectionSettingsToModal() {
  const config = state.state.projecaoFinanceira;
  const setup = document.getElementById('modal_setupPorCliente');
  const recurring = document.getElementById('modal_mensalidadeRecorrente');
  const newClients = document.getElementById('modal_novosClientesMes');
  const reference = document.getElementById('modal_mesReferencia');
  const active = document.getElementById('modal_projecaoAtiva');
  const autoSave = document.getElementById('modal_autoSave');

  if (setup) { setup.value = formatBRL(config.setupPorCliente); setup.dataset.num = config.setupPorCliente; }
  if (recurring) { recurring.value = formatBRL(config.mensalidadeRecorrente); recurring.dataset.num = config.mensalidadeRecorrente; }
  if (newClients) newClients.value = config.novosClientesMes;
  if (reference) reference.value = String(config.mesReferencia);
  if (active) active.checked = config.ativa;
  if (autoSave) autoSave.checked = state.state.storage?.autoSave ?? true;
}

/**
 * Renderiza tabelas de alíquotas
 */
function drawTabela(tableId, data, tipo) {
  const tbody = document.querySelector(`#${tableId} tbody`);
  if (!tbody) return;
  tbody.innerHTML = '';

  data.forEach((row, idx) => {
    const tr = document.createElement('tr');
    const limiteAberto = tipo === 'IRPF' && row.lim === null;
    const limiteCell = limiteAberto
      ? '<td><span class="table-open-range">Acima da faixa anterior</span></td>'
      : `<td><input type="text" class="tbl-lim" data-mask="currency" value="${formatBRL(row.lim)}" data-row="${idx}" data-tipo="${tipo}"></td>`;

    tr.innerHTML = `
      ${limiteCell}
      <td><input type="text" class="tbl-aliq" data-mask="percent" value="${formatPct(row.aliq)}" data-row="${idx}" data-tipo="${tipo}"></td>
      <td><input type="text" class="tbl-pd" data-mask="currency" value="${formatBRL(row.pd)}" data-row="${idx}" data-tipo="${tipo}"></td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('input').forEach(el => {
    el.addEventListener('blur', (e) => {
      const r = parseInt(el.dataset.row);
      const t = el.dataset.tipo;
      if (isNaN(r)) return;

      const val = el.classList.contains('tbl-aliq') ? parsePct(e.target.value) : parseBRL(e.target.value);
      const key = el.classList.contains('tbl-lim') ? 'lim' : (el.classList.contains('tbl-aliq') ? 'aliq' : 'pd');

      if (t === 'III') state.state.tabelaIII[r][key] = val;
      else if (t === 'V') state.state.tabelaV[r][key] = val;
      else if (t === 'IRPF') state.state.tabelaIRPF[r][key] = val;

      calcAll();
    });
  });

  attachMasks();
}

/**
 * Renderiza funcionários
 */
function renderFuncionarios() {
  const container = document.getElementById('listaFuncionarios');
  container.innerHTML = '';

  state.state.funcionarios.forEach((f, idx) => {
    const div = document.createElement('div');
    div.className = 'item-add';
    div.innerHTML = `
      <input type="text" placeholder="Nome/Cargo" value="${escapeHTML(f.nome)}" class="f-nome">
      <input type="text" data-mask="currency" value="${formatBRL(f.salario)}" class="f-sal">
      <input type="text" data-mask="currency" value="${formatBRL(f.beneficios)}" class="f-ben">
      <span class="value" id="custo-func-${idx}">R$ 0,00</span>
      <button class="btn small danger">✕ Deletar esse Funcionário</button>
    `;

    div.querySelector('.f-nome').addEventListener('input', (e) => {
      state.state.funcionarios[idx].nome = e.target.value;
      salvarLocalStorageDebounced();
    });

    div.querySelector('.f-sal').addEventListener('blur', (e) => {
      const funcionario = state.state.funcionarios[idx];
      state.updateFuncionario(idx, funcionario.nome, parseBRL(e.target.value), funcionario.beneficios);
      calcAll();
    });

    div.querySelector('.f-ben').addEventListener('blur', (e) => {
      const funcionario = state.state.funcionarios[idx];
      state.updateFuncionario(idx, funcionario.nome, funcionario.salario, parseBRL(e.target.value));
      calcAll();
    });

    div.querySelector('.danger').addEventListener('click', () => {
      state.removeFuncionario(idx);
      renderFuncionarios();
      calcAll();
    });

    container.appendChild(div);
  });

  attachMasks();
}

/**
 * Renderiza contratos CT
 */
function renderCT() {
  const container = document.getElementById('listaCT');
  container.innerHTML = '';

  state.state.contratosCT.forEach((c, idx) => {
    const div = document.createElement('div');
    div.className = 'item-add';
    div.innerHTML = `
      <input type="text" placeholder="Descrição" value="${escapeHTML(c.descricao)}" class="c-desc">
      <input type="text" data-mask="currency" value="${formatBRL(c.valor)}" class="c-val">
      <button class="btn small danger">✕</button>
    `;

    div.querySelector('.c-desc').addEventListener('input', (e) => {
      state.state.contratosCT[idx].descricao = e.target.value;
      salvarLocalStorageDebounced();
    });

    div.querySelector('.c-val').addEventListener('blur', (e) => {
      state.state.contratosCT[idx].valor = parseBRL(e.target.value);
      calcAll();
    });

    div.querySelector('.danger').addEventListener('click', () => {
      state.removeContratosCT(idx);
      renderCT();
      calcAll();
    });

    container.appendChild(div);
  });

  attachMasks();
}

/**
 * Renderiza custos variáveis
 */
function renderVariaveis() {
  const container = document.getElementById('listaVariaveis');
  container.innerHTML = '';

  state.state.custosVariaveis.forEach((v, idx) => {
    const div = document.createElement('div');
    div.className = 'item-add';
    div.innerHTML = `
      <input type="text" placeholder="Descrição" value="${escapeHTML(v.descricao)}" class="v-desc">
      <input type="text" data-mask="currency" value="${formatBRL(v.valor)}" class="v-val">
      <button class="btn small danger">✕</button>
    `;

    div.querySelector('.v-desc').addEventListener('input', (e) => {
      state.state.custosVariaveis[idx].descricao = e.target.value;
      salvarLocalStorageDebounced();
    });

    div.querySelector('.v-val').addEventListener('blur', (e) => {
      state.state.custosVariaveis[idx].valor = parseBRL(e.target.value);
      calcAll();
    });

    div.querySelector('.danger').addEventListener('click', () => {
      state.removeCustoVariavel(idx);
      renderVariaveis();
      calcAll();
    });

    container.appendChild(div);
  });

  attachMasks();
}

/**
 * Calcula todos os valores
 */
function calcAll() {
  try {
    // Sincroniza estado com inputs sem sobrescrever a projeção ativa.
    if (state.state.projecaoFinanceira.ativa) {
      state.applyRevenueProjection();
    } else {
      state.state.receitaMensal = getNum('receitaMensal');
      state.state.receitas12m[11] = state.state.receitaMensal;
    }
    state.state.prolabore = getNum('prolabore');
    state.state.tetoINSS = getNum('tetoINSS');

    Object.keys(state.state.aliquotas).forEach(key => {
      if (document.getElementById(key)) {
        state.state.aliquotas[key] = getPctNum(key);
      }
    });

    // Recalcula
    calculator = new TaxCalculator(state.state);
    const results = calculator.calcAll();

    // Atualiza custos individuais dos funcionários
    state.state.funcionarios.forEach((f, idx) => {
      const elIndividual = document.getElementById(`custo-func-${idx}`);
      if (elIndividual) {
        // Pegamos a taxa de encargos calculada pelo TaxCalculator
        const taxRate = results.clt.taxRate; 
        const salary = f.salario || 0;
        const benefits = f.beneficios || 0;
        
        // Fórmula: Salário + (Salário * Encargos) + Benefícios
        const totalIndividual = salary + (salary * taxRate) + benefits;
        
        elIndividual.textContent = formatBRL(totalIndividual);
      }
    });

    // Atualiza RBT12 a partir da mesma base consumida pelo TaxCalculator.
    const revenueBase = results.revenueBase ?? state.getRevenueBase();
    const rbt12El = document.getElementById('rbt12');
    if (rbt12El) {
      rbt12El.value = formatBRL(revenueBase.rbt12);
      rbt12El.dataset.num = revenueBase.rbt12;
    }
    const receitaEl = document.getElementById('receitaMensal');
    if (receitaEl) {
      receitaEl.value = formatBRL(revenueBase.receitaMensal);
      receitaEl.dataset.num = revenueBase.receitaMensal;
    }

    // Atualiza Folha12
    const folha12El = document.getElementById('folha12');
    if (folha12El) {
      folha12El.value = formatBRL(results.folha12);
      folha12El.dataset.num = results.folha12;
    }

    // Atualiza Fator R
    const fatorREl = document.getElementById('fatorR');
    if (fatorREl) fatorREl.textContent = formatPct(results.fatorR);

    const anexoEl = document.getElementById('anexoAplicado');
    if (anexoEl) {
      anexoEl.innerHTML = `<span class="pill ${results.anexo === 'III' ? 'ok' : 'warn'}">${results.anexo}</span>`;
    }
    const fatorRBaseEl = document.getElementById('fatorRBase');
    if (fatorRBaseEl) {
      fatorRBaseEl.textContent = revenueBase.origem === 'projecao'
        ? 'Base usada: projeção financeira configurada.'
        : 'Base usada: histórico manual dos 12 meses.';
    }

    // Atualiza DAS
    if (state.state.modoAvancado) {
      document.getElementById('dasMensalAvancado').textContent = formatBRL(results.das);
      document.getElementById('aliquotaEfetiva').textContent = formatPct(results.aliquotaEfetiva);
    } else {
      document.getElementById('dasMensal').textContent = formatBRL(results.das);
    }

    // Atualiza Sócio
    document.getElementById('inssSocio').textContent = formatBRL(results.socio.inssSocio);
    document.getElementById('irpfSocio').textContent = formatBRL(results.socio.irpf);
    document.getElementById('custoPatronalProlabore').textContent = formatBRL(results.socio.custoPatronal);
    document.getElementById('custoSocioTotal').textContent = formatBRL(results.socio.totalSocio);

    // Atualiza CLT
    document.getElementById('custoCLTTotal').textContent = formatBRL(results.clt.totalCost);

    // Atualiza CT
    document.getElementById('custoCTTotal').textContent = formatBRL(results.ct.custoTotal);

    // Atualiza Variáveis
    document.getElementById('custoVariavelTotal').textContent = formatBRL(results.variaveis.total);
    document.getElementById('percVariavel').textContent = formatPct(results.variaveis.perc);

    // Atualiza Consolidação
    document.getElementById('outDAS').textContent = formatBRL(results.das);
    document.getElementById('outINSSSocio').textContent = formatBRL(results.socio.inssSocio);
    document.getElementById('outIRPF').textContent = formatBRL(results.socio.irpf);
    document.getElementById('outCLT').textContent = formatBRL(results.clt.totalCharges);
    document.getElementById('outCT').textContent = formatBRL(results.ct.tributosTotal);
    document.getElementById('outCPP').textContent = formatBRL(results.socio.custoPatronal);
    document.getElementById('cargaTotal').textContent = formatBRL(results.cargaTributaria);

    // Indicadores
    document.getElementById('indCarga').textContent = formatIndicator(results.cargaTributaria, results.receita);
    document.getElementById('indCustoOp').textContent = formatIndicator(results.custoOperacao, results.receita);
    document.getElementById('indVariaveis').textContent = formatIndicator(results.variaveis.total, results.receita);
    document.getElementById('indTotalDespesas').textContent = formatIndicator(results.totalDespesas, results.receita);

    // Renderiza gráficos e cronograma com os resultados atuais
    drawCharts(results);
    renderRevenueProjection();

    // Salva no histórico e, se habilitado, no localStorage
    state.pushToHistory();
    salvarLocalStorageDebounced();
    updateStorageStatus();
  } catch (e) {
    console.error('Erro ao calcular:', e);
  }
}

/**
 * Desenha gráficos
 */
function updateChart(chart, context, type, labels, data, colors) {
  if (chart) {
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.data.datasets[0].backgroundColor = colors;
    chart.update('none');
    return chart;
  }

  return new Chart(context, {
    type,
    data: {
      labels,
      datasets: [{ data, backgroundColor: colors }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { position: 'bottom' } }
    }
  });
}

/**
 * Atualiza os gráficos a partir do resultado já calculado no ciclo corrente.
 */
function drawCharts(results) {
  const ctxCarga = document.getElementById('chartCarga');
  if (ctxCarga) {
    chartCarga = updateChart(
      chartCarga,
      ctxCarga,
      'pie',
      ['DAS', 'INSS do sócio', 'IRPF', 'Encargos CLT', 'Tributos CT'],
      [
        results.das,
        results.socio.inssSocio,
        results.socio.irpf,
        results.clt.totalCharges,
        results.ct.tributosTotal
      ],
      ['#4cc9f0', '#80ffdb', '#ffd43b', '#ff6b6b', '#ff8c42']
    );
  }

  const ctxCustos = document.getElementById('chartCustos');
  if (ctxCustos) {
    chartCustos = updateChart(
      chartCustos,
      ctxCustos,
      'doughnut',
      ['Sócio', 'CLT', 'CT (com tributos)', 'Variáveis'],
      [
        results.socio.totalSocio,
        results.clt.totalCost,
        results.ct.custoTotal,
        results.variaveis.total
      ],
      ['#4cc9f0', '#80ffdb', '#ffd43b', '#ff6b6b']
    );
  }
}

/**
 * Salva no localStorage com debounce
 */
function salvarLocalStorageDebounced() {
  clearTimeout(saveTimer);
  if (!state.state.storage?.autoSave) {
    updateStorageStatus();
    return;
  }

  saveTimer = setTimeout(() => {
    if (state.saveToStorage()) updateStorageStatus();
  }, 1000);
}

/**
 * Abre modal de configurações
 */
function openSettings() {
  const fields = ['aliquotaIII', 'aliquotaV', 'limiarFatorR', 'fgts', 'fgtsMulta', 'decimoTerceiro', 'ferias', 'inssPatronalProlabore', 'inssPatronalCLT', 'iss', 'retencoes'];

  fields.forEach(f => {
    const modalEl = document.getElementById(`modal_${f}`);
    const originalEl = document.getElementById(f);
    if (modalEl && originalEl) {
      modalEl.value = originalEl.value;
    }
  });

  syncProjectionSettingsToModal();
  document.getElementById('modalSettings').showModal();
}

/**
 * Salva configurações
 */
function saveSettings() {
  const fields = ['aliquotaIII', 'aliquotaV', 'limiarFatorR', 'fgts', 'fgtsMulta', 'decimoTerceiro', 'ferias', 'inssPatronalProlabore', 'inssPatronalCLT', 'iss', 'retencoes'];

  fields.forEach(f => {
    const modalEl = document.getElementById(`modal_${f}`);
    const el = document.getElementById(f);
    if (modalEl && el) {
      const value = parsePct(modalEl.value);
      el.value = formatPct(value);
      el.dataset.num = value;
    }
  });

  const setupEl = document.getElementById('modal_setupPorCliente');
  const recurringEl = document.getElementById('modal_mensalidadeRecorrente');
  const newClientsEl = document.getElementById('modal_novosClientesMes');
  const referenceEl = document.getElementById('modal_mesReferencia');
  const projectionActiveEl = document.getElementById('modal_projecaoAtiva');
  const autoSaveEl = document.getElementById('modal_autoSave');

  state.state.projecaoFinanceira = {
    ...state.state.projecaoFinanceira,
    setupPorCliente: setupEl ? parseBRL(setupEl.value) : state.state.projecaoFinanceira.setupPorCliente,
    mensalidadeRecorrente: recurringEl ? parseBRL(recurringEl.value) : state.state.projecaoFinanceira.mensalidadeRecorrente,
    novosClientesMes: newClientsEl ? Math.max(0, parseInt(newClientsEl.value, 10) || 0) : state.state.projecaoFinanceira.novosClientesMes,
    mesReferencia: referenceEl ? Math.min(12, Math.max(1, parseInt(referenceEl.value, 10) || 12)) : state.state.projecaoFinanceira.mesReferencia,
    ativa: projectionActiveEl?.checked ?? state.state.projecaoFinanceira.ativa
  };
  state.state.storage.autoSave = autoSaveEl?.checked ?? state.state.storage.autoSave;

  if (state.state.projecaoFinanceira.ativa) state.applyRevenueProjection();
  document.getElementById('modalSettings').close();
  applyStateToUI();
  calcAll();
}

/**
 * Conecta eventos
 */
function wireEvents() {
  // Receita mensal
  document.getElementById('receitaMensal').addEventListener('blur', () => {
    state.state.projecaoFinanceira.ativa = false;
    const projectionToggle = document.getElementById('modal_projecaoAtiva');
    if (projectionToggle) projectionToggle.checked = false;
    calcAll();
  });

  // Modo avançado
  document.getElementById('modoAvancadoSimples').addEventListener('change', (e) => {
    state.state.modoAvancado = e.target.checked;
    document.getElementById('simplesBasico').style.display = state.state.modoAvancado ? 'none' : 'block';
    document.getElementById('simplesAvancado').style.display = state.state.modoAvancado ? 'block' : 'none';
    calcAll();
  });

  // Configurações
  document.getElementById('btnOpenSettings').addEventListener('click', openSettings);
  document.getElementById('btnSaveModal').addEventListener('click', saveSettings);

  // Histórico e gerenciamento do localStorage
  document.getElementById('btnUndo').addEventListener('click', () => {
    if (state.undo()) {
      applyStateToUI();
      calcAll();
    }
  });

  document.getElementById('btnSaveStorage').addEventListener('click', () => {
    if (state.saveToStorage()) updateStorageStatus('Estado salvo neste navegador agora.');
    else updateStorageStatus('Não foi possível salvar neste navegador.');
  });

  document.getElementById('btnLoadStorage').addEventListener('click', () => {
    if (state.loadFromStorage()) {
      applyStateToUI();
      calcAll();
      updateStorageStatus('Estado salvo carregado neste navegador.');
    } else {
      updateStorageStatus('Nenhum estado salvo foi encontrado neste navegador.');
    }
  });

  document.getElementById('btnClearStorage').addEventListener('click', () => {
    if (confirm('Remover o estado salvo deste navegador? Os dados atuais permanecerão na tela.')) {
      if (state.clearStorage()) updateStorageStatus('Estado salvo removido. Os dados atuais permanecem na tela.');
      else updateStorageStatus('Não foi possível limpar o estado salvo.');
    }
  });

  // Exportação e importação
  document.getElementById('btnDownloadJSON').addEventListener('click', () => {
    ReportExporter.downloadJSON(new TaxCalculator(state.state).calcAll(), state.state);
  });

  document.getElementById('btnExportCSV').addEventListener('click', () => {
    ReportExporter.downloadCSV(new TaxCalculator(state.state).calcAll(), state.state);
  });

  document.getElementById('btnExportHTML').addEventListener('click', () => {
    ReportExporter.downloadHTML(new TaxCalculator(state.state).calcAll(), state.state);
  });

  document.getElementById('btnUploadJSON').addEventListener('change', (e) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (state.importFromJSON(ev.target.result)) {
        applyStateToUI();
        calcAll();
      } else {
        alert('Erro ao importar JSON');
      }
    };
    reader.readAsText(e.target.files[0]);
  });

  // Alíquotas e encargos
  ['prolabore', 'tetoINSS', 'inssEmpregado', 'inssPatronalProlabore', 'fgts', 'fgtsMulta', 'decimoTerceiro', 'ferias', 'inssPatronalCLT', 'rat', 'iss', 'retencoes', 'limiarFatorR', 'aliquotaIII', 'aliquotaV'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('blur', calcAll);
  });

  // Funcionários
  document.getElementById('adicionarFuncionario').addEventListener('click', () => {
    state.addFuncionario('', 0, 0);
    renderFuncionarios();
    calcAll();
  });

  // Contratos CT
  document.getElementById('adicionarCT').addEventListener('click', () => {
    state.addContratosCT('', 0);
    renderCT();
    calcAll();
  });

  // Custos Variáveis
  document.getElementById('adicionarVariacel').addEventListener('click', () => {
    state.addCustoVariavel('', 0);
    renderVariaveis();
    calcAll();
  });

  // Tabelas padrão
  document.getElementById('preencherTabelaPadrao').addEventListener('click', () => {
    state.state.tabelaIII = JSON.parse(JSON.stringify(state.INITIAL_STATE.tabelaIII));
    state.state.tabelaV = JSON.parse(JSON.stringify(state.INITIAL_STATE.tabelaV));
    drawTabela('tabelaIII', state.state.tabelaIII, 'III');
    drawTabela('tabelaV', state.state.tabelaV, 'V');
    calcAll();
  });

  // Resetar
  document.getElementById('resetar').addEventListener('click', () => {
    if (confirm('Sair sem salvar e resetar para padrão?')) {
      state.reset();
      applyStateToUI();
      calcAll();
    }
  });

  // Calculadora de Preço
  document.getElementById('btnCalcPreco').addEventListener('click', calcularPreco);
}

/**
 * Calcula preço de venda
 */
function calcularPreco() {
  try {
    const custos = getNum('precoCustos');
    const lucro = getNum('precoLucro');
    const aliquota = getPctNum('precoAliquota');

    const analise = PricingCalculator.calcAnaliseCompleta(custos, lucro, aliquota);

    document.getElementById('precoMinimo').textContent = formatBRL(analise.precoVenda);

    const resultados = document.getElementById('precoResultados');
    resultados.innerHTML = `
      <div class="row">
        <div class="card">
          <h3>Análise do Preço</h3>
          <div class="total">
            <span class="label">Ponto de Equilíbrio</span>
            <strong>${formatBRL(analise.pontoEquilibrio)}</strong>
          </div>
          <div class="total">
            <span class="label">Receita Líquida</span>
            <strong>${formatBRL(analise.receita)}</strong>
          </div>
          <div class="total">
            <span class="label">DAS a Pagar</span>
            <strong>${formatBRL(analise.das)}</strong>
          </div>
          <div class="total">
            <span class="label">Lucro Resultante</span>
            <strong>${formatBRL(analise.lucroResultante)}</strong>
          </div>
          <div class="total highlight">
            <span class="label">Margem de Lucro</span>
            <strong>${formatPct(analise.margem)}</strong>
          </div>
        </div>
      </div>
    `;
  } catch (e) {
    alert('Erro ao calcular preço: ' + e.message);
  }
}

// Inicializa quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', init);
