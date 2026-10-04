import test from 'node:test';
import assert from 'node:assert/strict';

import State from '../src/js/models/State.js';
import TaxCalculator from '../src/js/models/TaxCalculator.js';
import RevenueProjection from '../src/js/models/RevenueProjection.js';
import ReportExporter from '../src/js/utils/exporters.js';

const criarEstado = (ajustes = {}) => {
  const store = new State();
  const base = store.createInitialState();

  return {
    ...base,
    projecaoFinanceira: {
      ...base.projecaoFinanceira,
      ativa: false,
      ...(ajustes.projecaoFinanceira ?? {})
    },
    ...ajustes,
    aliquotas: { ...base.aliquotas, ...(ajustes.aliquotas ?? {}) },
    irpf: {
      ...base.irpf,
      ...(ajustes.irpf ?? {}),
      reducaoMensal: {
        ...base.irpf.reducaoMensal,
        ...(ajustes.irpf?.reducaoMensal ?? {})
      }
    }
  };
};

const aproximar = (valor, esperado, precisao = 1e-6) => {
  assert.ok(
    Math.abs(valor - esperado) <= precisao,
    `Esperado ${esperado}, recebido ${valor}`
  );
};

test('usa a projeção ativa como base oficial do RBT12 e do Fator R', () => {
  const state = criarEstado({
    receitaMensal: 999999,
    receitas12m: new Array(12).fill(999999),
    prolabore: 12,
    projecaoFinanceira: {
      ativa: true,
      setupPorCliente: 100,
      mensalidadeRecorrente: 0,
      novosClientesMes: 1,
      mesReferencia: 12
    }
  });

  const results = new TaxCalculator(state).calcAll();

  aproximar(results.rbt12, 1200);
  aproximar(results.receita, 100);
  aproximar(results.fatorR, 0.12);
  assert.equal(results.revenueBase.origem, 'projecao');
});

test('funcionário novo altera folha e Fator R após atualização', () => {
  const store = new State();
  const state = criarEstado({
    receitaMensal: 10000,
    receitas12m: new Array(12).fill(10000),
    prolabore: 0,
    funcionarios: []
  });
  store.setState(state);

  assert.equal(new TaxCalculator(store.state).calcAll().anexo, 'V');
  store.addFuncionario('Analista', 2800, 0);
  const results = new TaxCalculator(store.state).calcAll();

  aproximar(results.folha12, 43895.04);
  aproximar(results.fatorR, 0.365792);
  assert.equal(results.anexo, 'III');
});

test('importa uma projeção ativa e reconstrói a nova base antes do Fator R', () => {
  const source = new State();
  source.state.projecaoFinanceira = {
    ativa: true,
    setupPorCliente: 100,
    mensalidadeRecorrente: 0,
    novosClientesMes: 1,
    mesReferencia: 12
  };
  source.state.receitas12m = new Array(12).fill(999999);
  source.state.receitaMensal = 999999;

  const json = ReportExporter.exportToJSON(new TaxCalculator(source.state).calcAll(), source.state);
  const target = new State();
  assert.equal(target.importFromJSON(json), true);

  const results = new TaxCalculator(target.state).calcAll();
  aproximar(results.rbt12, 1200);
  aproximar(results.receita, 100);
  assert.equal(results.revenueBase.origem, 'projecao');
  assert.deepEqual(target.state.receitas12m, new Array(12).fill(100));
});

test('preserva todos os dados no round-trip do JSON exportado pela aplicação', () => {
  const source = new State();
  source.state.projecaoFinanceira = {
    ativa: false,
    setupPorCliente: 2400,
    mensalidadeRecorrente: 350,
    novosClientesMes: 3,
    mesReferencia: 8
  };
  source.state.receitaMensal = 18000;
  source.state.receitas12m = new Array(12).fill(18000);
  source.state.funcionarios = [{ nome: 'Especialista', salario: 4200, beneficios: 300 }];
  source.state.contratosCT = [{ descricao: 'PJ', valor: 2500 }];
  source.state.custosVariaveis = [{ descricao: 'SaaS', valor: 180 }];
  source.state.aliquotas.iss = 0.04;
  source.state.modoAvancado = true;

  const json = ReportExporter.exportToJSON(new TaxCalculator(source.state).calcAll(), source.state);
  const target = new State();
  assert.equal(target.importFromJSON(json), true);

  assert.deepEqual(target.state.projecaoFinanceira, source.state.projecaoFinanceira);
  assert.deepEqual(target.state.receitas12m, source.state.receitas12m);
  assert.deepEqual(target.state.funcionarios, source.state.funcionarios);
  assert.deepEqual(target.state.contratosCT, source.state.contratosCT);
  assert.deepEqual(target.state.custosVariaveis, source.state.custosVariaveis);
  assert.equal(target.state.aliquotas.iss, 0.04);
  assert.equal(target.state.modoAvancado, true);

  const results = new TaxCalculator(target.state).calcAll();
  assert.match(ReportExporter.exportToCSV(results, target.state), /Origem da base,manual/);
  assert.match(ReportExporter.exportToHTML(results, target.state), /Histórico manual/);
});

test('calcula tributos CT uma única vez no custo e no total de despesas', () => {
  const state = criarEstado({
    receitaMensal: 20000,
    receitas12m: new Array(12).fill(20000),
    prolabore: 0,
    contratosCT: [{ descricao: 'Prestador', valor: 1000 }],
    custosVariaveis: [{ descricao: 'Software', valor: 200 }],
    aliquotas: {
      aliquotaV: 0.12,
      iss: 0.03,
      retencoes: 0.045
    }
  });

  const results = new TaxCalculator(state).calcAll();

  aproximar(results.ct.baseTotal, 1000);
  aproximar(results.ct.issTotal, 30);
  aproximar(results.ct.outrasRetencoesTotal, 45);
  aproximar(results.ct.tributosTotal, 75);
  aproximar(results.ct.custoTotal, 1075);
  aproximar(results.custoOperacao, 1075);
  aproximar(results.das, 2400);
  aproximar(results.totalDespesas, 3675);
  aproximar(results.cargaTributaria, 2475);

  assert.equal(
    results.totalDespesas,
    results.das + results.custoOperacao + results.variaveis.total
  );
});

test('não adiciona CPP patronal ao Anexo V quando o DAS já a contempla', () => {
  const state = criarEstado({
    receitaMensal: 10000,
    receitas12m: new Array(12).fill(10000),
    prolabore: 2000,
    aliquotas: { aliquotaV: 0.12 }
  });

  const results = new TaxCalculator(state).calcAll();

  assert.equal(results.anexo, 'V');
  aproximar(results.socio.custoPatronal, 0);
  aproximar(results.socio.totalSocio, 2000);
  assert.equal(
    results.cargaTributaria,
    results.das + results.socio.inssSocio + results.socio.irpf + results.clt.totalCharges + results.ct.tributosTotal
  );
});

test('classifica o Fator R no Anexo III a partir de 28%', () => {
  const state = criarEstado({
    receitaMensal: 10000,
    receitas12m: new Array(12).fill(10000),
    prolabore: 2800
  });

  const results = new TaxCalculator(state).calcAll();

  aproximar(results.fatorR, 0.28);
  assert.equal(results.anexo, 'III');
});

test('aplica a redução de IRPF de 2026 para pró-labore de até R$ 5 mil', () => {
  const state = criarEstado({ prolabore: 5000 });
  const results = new TaxCalculator(state).calcAll();

  aproximar(results.socio.inssSocio, 550);
  aproximar(results.socio.deducaoIRPF, 607.20);
  aproximar(results.socio.baseIRPF, 4392.80);
  aproximar(results.socio.irpf, 0);
});

test('saneia dados persistidos antigos e incompletos sem propagar valores inválidos', () => {
  const store = new State();
  const hydrated = store.hydrateState({
    receitaMensal: -100,
    receitas12m: [1000, 'inválido'],
    prolabore: '5000',
    tetoINSS: Infinity,
    modoAvancado: 'false',
    storage: { autoSave: 'false' },
    projecaoFinanceira: { ativa: 'false' },
    aliquotas: { iss: 2, retencoes: 0.045 },
    contratosCT: [{ descricao: '<script>', valor: -1 }],
    tabelaIRPF: [{ lim: 1000, aliq: 2, pd: -1 }]
  });

  assert.equal(hydrated.receitaMensal, 22227.35);
  assert.equal(hydrated.receitas12m[0], 1000);
  assert.equal(hydrated.receitas12m[1], 10338.85);
  assert.equal(hydrated.prolabore, 5000);
  assert.equal(hydrated.tetoINSS, 8475.55);
  assert.equal(hydrated.aliquotas.iss, 0.03);
  assert.equal(hydrated.aliquotas.retencoes, 0.045);
  assert.equal(hydrated.contratosCT[0].valor, 0);
  assert.equal(hydrated.tabelaIRPF[0].aliq, 0);
  assert.equal(hydrated.tabelaIRPF[0].pd, 0);
  assert.equal(hydrated.projecaoFinanceira.ativa, false);
  assert.equal(hydrated.modoAvancado, false);
  assert.equal(hydrated.storage.autoSave, false);
});

test('aplica redução parcial de IRPF de 2026 entre R$ 5 mil e R$ 7.350', () => {
  const state = criarEstado({ prolabore: 6000 });
  const results = new TaxCalculator(state).calcAll();

  aproximar(results.socio.inssSocio, 660);
  aproximar(results.socio.baseIRPF, 5340);
  aproximar(results.socio.irpf, 380.02);
});

test('gera o cronograma do Ano 1 com setup no mês de entrada e mensalidade a partir do mês seguinte', () => {
  const projection = RevenueProjection.generate({
    setupPorCliente: 1830,
    mensalidadeRecorrente: 237.77,
    novosClientesMes: 5,
    mesReferencia: 12
  });

  assert.equal(projection.length, 12);
  aproximar(projection[0].total, 9150);
  aproximar(projection[0].faturamentoMensal, 0);
  aproximar(projection[1].faturamentoMensal, 1188.85);
  aproximar(projection[11].faturamentoMensal, 13077.35);
  aproximar(projection[11].total, 22227.35);
  aproximar(projection.reduce((sum, month) => sum + month.faturamentoSetup, 0), 109800);
  aproximar(projection.reduce((sum, month) => sum + month.faturamentoMensal, 0), 78464.10);
  aproximar(projection.reduce((sum, month) => sum + month.total, 0), 188264.10);
});

test('salva, carrega e limpa o estado no localStorage com metadados', () => {
  const data = new Map();
  globalThis.localStorage = {
    setItem: (key, value) => data.set(key, value),
    getItem: (key) => data.get(key) ?? null,
    removeItem: (key) => data.delete(key)
  };

  try {
    const original = new State();
    original.state.projecaoFinanceira.setupPorCliente = 2000;
    assert.equal(original.saveToStorage(), true);
    assert.ok(original.getStorageMetadata()?.savedAt);

    const restored = new State();
    assert.equal(restored.loadFromStorage(), true);
    assert.equal(restored.state.projecaoFinanceira.setupPorCliente, 2000);
    assert.equal(restored.clearStorage(), true);
    assert.equal(restored.getStorageMetadata(), null);
  } finally {
    delete globalThis.localStorage;
  }
});
