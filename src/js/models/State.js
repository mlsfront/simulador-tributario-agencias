/**
 * State.js - Gerenciamento de estado da aplicação
 * Responsável por armazenar e gerenciar todo o estado do simulador
 */

import RevenueProjection from './RevenueProjection.js';

class State {
  constructor() {
    this.INITIAL_STATE = {
      version: '4.2.1',
      modoAvancado: false,
      receitaMensal: 0,
      receitas12m: new Array(12).fill(0),
      projecaoFinanceira: {
        ativa: true,
        setupPorCliente: 1830,
        mensalidadeRecorrente: 237.77,
        novosClientesMes: 5,
        mesReferencia: 12
      },
      storage: {
        autoSave: true
      },
      prolabore: 3000,
      tetoINSS: 8475.55,
      aliquotas: {
        aliquotaIII: 0.06,
        aliquotaV: 0.12,
        limiarFatorR: 0.28,
        inssEmpregado: 0.11,
        inssPatronalProlabore: 0.20,
        fgts: 0.08,
        fgtsMulta: 0.032,
        decimoTerceiro: 0.0833,
        ferias: 0.1111,
        inssPatronalCLT: 0,
        rat: 0,
        iss: 0.03,
        retencoes: 0
      },
      funcionarios: [],
      contratosCT: [],
      custosVariaveis: [],
      tabelaIII: [
        { lim: 180000, aliq: 0.06, pd: 0 },
        { lim: 360000, aliq: 0.112, pd: 9360 },
        { lim: 720000, aliq: 0.135, pd: 17640 },
        { lim: 1800000, aliq: 0.16, pd: 35640 },
        { lim: 3600000, aliq: 0.21, pd: 125640 },
        { lim: 4800000, aliq: 0.33, pd: 648000 }
      ],
      tabelaV: [
        { lim: 180000, aliq: 0.155, pd: 0 },
        { lim: 360000, aliq: 0.18, pd: 4500 },
        { lim: 720000, aliq: 0.19, pd: 8100 },
        { lim: 1800000, aliq: 0.205, pd: 18900 },
        { lim: 3600000, aliq: 0.23, pd: 63900 },
        { lim: 4800000, aliq: 0.305, pd: 333000 }
      ],
      irpf: {
        descontoSimplificadoMensal: 607.20,
        reducaoMensal: {
          ativa: true,
          limiteIntegral: 5000,
          limiteFinal: 7350,
          valorMaximo: 312.89,
          constante: 978.62,
          fator: 0.133145
        }
      },
      tabelaIRPF: [
        { lim: 2428.80, aliq: 0, pd: 0 },
        { lim: 2826.65, aliq: 0.075, pd: 182.16 },
        { lim: 3751.05, aliq: 0.15, pd: 394.16 },
        { lim: 4664.68, aliq: 0.225, pd: 675.49 },
        { lim: null, aliq: 0.275, pd: 908.73 }
      ]
    };

    const initialProjection = RevenueProjection.generate(this.INITIAL_STATE.projecaoFinanceira);
    this.INITIAL_STATE.receitas12m = initialProjection.map((month) => month.total);
    this.INITIAL_STATE.receitaMensal = initialProjection[this.INITIAL_STATE.projecaoFinanceira.mesReferencia - 1].total;

    this.state = JSON.parse(JSON.stringify(this.INITIAL_STATE));
    this.historyStack = [];
    this.MAX_HISTORY = 20;
    this.STORAGE_KEY = 'simuladorTributarioV4';
    this.observers = [];
  }

  /**
   * Gera o cronograma de receita projetado para 12 meses.
   */
  getRevenueProjection(config = this.state?.projecaoFinanceira || this.INITIAL_STATE.projecaoFinanceira) {
    return RevenueProjection.generate(config);
  }

  /**
   * Aplica a projeção ao histórico de receitas e à receita mensal de referência.
   */
  applyRevenueProjection() {
    const projection = RevenueProjection.applyToState(this.state);
    this.notifyObservers();
    return projection;
  }

  /**
   * Cria uma cópia profunda dos parâmetros padrão.
   */
  createInitialState() {
    return JSON.parse(JSON.stringify(this.INITIAL_STATE));
  }

  /**
   * Normaliza um número monetário para impedir NaN, infinitos e negativos.
   */
  normalizeCurrency(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : fallback;
  }

  /**
   * Normaliza uma alíquota decimal entre zero e um.
   */
  normalizePercentage(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 && number <= 1 ? number : fallback;
  }

  /**
   * Normaliza um número inteiro não negativo.
   */
  normalizeInteger(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? Math.floor(number) : fallback;
  }

  /**
   * Migra e saneia estados importados ou persistidos para o schema atual.
   */
  hydrateState(candidate) {
    const defaults = this.createInitialState();
    const normalizeBoolean = (value, fallback) => {
      if (typeof value === 'boolean') return value;
      if (value === 'true') return true;
      if (value === 'false') return false;
      return fallback;
    };
    const hasProjectionConfig = Boolean(
      candidate?.projecaoFinanceira && typeof candidate.projecaoFinanceira === 'object'
    );
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
      return defaults;
    }

    const hydrateTable = (table, defaultTable) => defaultTable.map((defaultRow, index) => {
      const row = Array.isArray(table) ? table[index] : null;
      const isLastOpenRange = defaultRow.lim === null;
      const lim = isLastOpenRange
        ? null
        : this.normalizeCurrency(row?.lim, defaultRow.lim);

      return {
        lim,
        aliq: this.normalizePercentage(row?.aliq, defaultRow.aliq),
        pd: this.normalizeCurrency(row?.pd, defaultRow.pd)
      };
    });

    const hydrateList = (list, textKey) => (Array.isArray(list) ? list : []).map((item) => ({
      [textKey]: typeof item?.[textKey] === 'string' ? item[textKey].slice(0, 200) : '',
      salario: this.normalizeCurrency(item?.salario),
      beneficios: this.normalizeCurrency(item?.beneficios),
      valor: this.normalizeCurrency(item?.valor)
    })).map((item) => {
      if (textKey === 'nome') {
        return { nome: item.nome, salario: item.salario, beneficios: item.beneficios };
      }
      return { descricao: item.descricao, valor: item.valor };
    });

    const receitas12m = Array.from({ length: 12 }, (_, index) =>
      this.normalizeCurrency(candidate.receitas12m?.[index], defaults.receitas12m[index])
    );

    return {
      ...defaults,
      modoAvancado: normalizeBoolean(candidate.modoAvancado, defaults.modoAvancado),
      receitaMensal: this.normalizeCurrency(candidate.receitaMensal, defaults.receitaMensal),
      receitas12m,
      projecaoFinanceira: {
        ativa: hasProjectionConfig
          ? normalizeBoolean(candidate.projecaoFinanceira?.ativa, defaults.projecaoFinanceira.ativa)
          : false,
        setupPorCliente: this.normalizeCurrency(
          candidate.projecaoFinanceira?.setupPorCliente,
          defaults.projecaoFinanceira.setupPorCliente
        ),
        mensalidadeRecorrente: this.normalizeCurrency(
          candidate.projecaoFinanceira?.mensalidadeRecorrente,
          defaults.projecaoFinanceira.mensalidadeRecorrente
        ),
        novosClientesMes: this.normalizeInteger(
          candidate.projecaoFinanceira?.novosClientesMes,
          defaults.projecaoFinanceira.novosClientesMes
        ),
        mesReferencia: Math.min(
          12,
          Math.max(
            1,
            this.normalizeInteger(
              candidate.projecaoFinanceira?.mesReferencia,
              defaults.projecaoFinanceira.mesReferencia
            )
          )
        )
      },
      storage: {
        autoSave: normalizeBoolean(candidate.storage?.autoSave, defaults.storage.autoSave)
      },
      prolabore: this.normalizeCurrency(candidate.prolabore, defaults.prolabore),
      tetoINSS: this.normalizeCurrency(candidate.tetoINSS, defaults.tetoINSS),
      aliquotas: Object.fromEntries(Object.entries(defaults.aliquotas).map(([key, value]) => [
        key,
        this.normalizePercentage(candidate.aliquotas?.[key], value)
      ])),
      funcionarios: hydrateList(candidate.funcionarios, 'nome'),
      contratosCT: hydrateList(candidate.contratosCT, 'descricao'),
      custosVariaveis: hydrateList(candidate.custosVariaveis, 'descricao'),
      tabelaIII: hydrateTable(candidate.tabelaIII, defaults.tabelaIII),
      tabelaV: hydrateTable(candidate.tabelaV, defaults.tabelaV),
      tabelaIRPF: hydrateTable(candidate.tabelaIRPF, defaults.tabelaIRPF),
      irpf: {
        descontoSimplificadoMensal: this.normalizeCurrency(
          candidate.irpf?.descontoSimplificadoMensal,
          defaults.irpf.descontoSimplificadoMensal
        ),
        reducaoMensal: {
          ativa: normalizeBoolean(candidate.irpf?.reducaoMensal?.ativa, defaults.irpf.reducaoMensal.ativa),
          limiteIntegral: this.normalizeCurrency(
            candidate.irpf?.reducaoMensal?.limiteIntegral,
            defaults.irpf.reducaoMensal.limiteIntegral
          ),
          limiteFinal: this.normalizeCurrency(
            candidate.irpf?.reducaoMensal?.limiteFinal,
            defaults.irpf.reducaoMensal.limiteFinal
          ),
          valorMaximo: this.normalizeCurrency(
            candidate.irpf?.reducaoMensal?.valorMaximo,
            defaults.irpf.reducaoMensal.valorMaximo
          ),
          constante: this.normalizeCurrency(
            candidate.irpf?.reducaoMensal?.constante,
            defaults.irpf.reducaoMensal.constante
          ),
          fator: this.normalizePercentage(
            candidate.irpf?.reducaoMensal?.fator,
            defaults.irpf.reducaoMensal.fator
          )
        }
      }
    };
  }

  /**
   * Resolve a fonte de receita usada pelo Fator R e pela interface.
   */
  getRevenueBase() {
    return RevenueProjection.resolve(this.state);
  }

  /**
   * Hidrata e sincroniza a fonte efetiva de receita antes do uso.
   */
  prepareState(candidate) {
    const hydrated = this.hydrateState(candidate);
    if (hydrated.projecaoFinanceira.ativa) {
      RevenueProjection.applyToState(hydrated);
    } else {
      hydrated.receitaMensal = hydrated.receitas12m[11];
    }
    return hydrated;
  }

  /**
   * Obtém o estado atual.
   */
  getState() {
    return this.state;
  }

  /**
   * Define o estado completo
   */
  setState(newState) {
    this.state = this.prepareState(newState);
    this.notifyObservers();
  }

  /**
   * Atualiza uma propriedade específica do estado
   */
  updateProperty(path, value) {
    const keys = path.split('.');
    let obj = this.state;
    
    for (let i = 0; i < keys.length - 1; i++) {
      obj = obj[keys[i]];
    }
    
    obj[keys[keys.length - 1]] = value;
    this.notifyObservers();
  }

  /**
   * Adiciona um observador para mudanças de estado
   */
  subscribe(callback) {
    this.observers.push(callback);
    return () => {
      this.observers = this.observers.filter(obs => obs !== callback);
    };
  }

  /**
   * Notifica todos os observadores sobre mudanças
   */
  notifyObservers() {
    this.observers.forEach(callback => callback(this.state));
  }

  /**
   * Salva o estado atual no histórico
   */
  pushToHistory() {
    const snapshot = JSON.stringify(this.state);
    if (this.historyStack.length === 0 || this.historyStack[this.historyStack.length - 1] !== snapshot) {
      this.historyStack.push(snapshot);
      if (this.historyStack.length > this.MAX_HISTORY) {
        this.historyStack.shift();
      }
    }
  }

  /**
   * Desfaz a última ação
   */
  undo() {
    if (this.historyStack.length > 1) {
      this.historyStack.pop();
      const prevState = JSON.parse(this.historyStack[this.historyStack.length - 1]);
      this.state = this.prepareState(prevState);
      this.notifyObservers();
      return true;
    }
    return false;
  }

  /**
   * Reseta para o estado padrão
   */
  reset() {
    this.state = this.prepareState(this.createInitialState());
    this.historyStack = [];
    this.notifyObservers();
  }

  /**
   * Salva o estado no localStorage
   */
  saveToStorage() {
    try {
      if (typeof localStorage === 'undefined') return false;

      const payload = {
        version: this.state.version,
        savedAt: new Date().toISOString(),
        state: this.state
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(payload));
      return true;
    } catch (e) {
      console.error('Erro ao salvar no localStorage:', e);
      return false;
    }
  }

  /**
   * Carrega o estado do localStorage
   */
  loadFromStorage() {
    try {
      if (typeof localStorage === 'undefined') return false;
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return false;
      
      const loadedState = JSON.parse(raw);
      const candidate = loadedState?.state && typeof loadedState.state === 'object'
        ? loadedState.state
        : loadedState;
      this.state = this.prepareState(candidate);
      this.notifyObservers();
      return true;
    } catch (e) {
      console.error('Erro ao carregar do localStorage:', e);
      return false;
    }
  }

  /**
   * Limpa o localStorage
   */
  clearStorage() {
    try {
      if (typeof localStorage === 'undefined') return false;
      localStorage.removeItem(this.STORAGE_KEY);
      return true;
    } catch (e) {
      console.error('Erro ao limpar localStorage:', e);
      return false;
    }
  }

  /**
   * Retorna metadados do snapshot salvo sem expor dados da aplicação.
   */
  getStorageMetadata() {
    try {
      if (typeof localStorage === 'undefined') return null;
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return null;
      const payload = JSON.parse(raw);
      return {
        savedAt: payload?.savedAt ?? null,
        version: payload?.version ?? payload?.state?.version ?? null
      };
    } catch (e) {
      console.error('Erro ao ler metadados do localStorage:', e);
      return null;
    }
  }

  /**
   * Exporta o estado como JSON
   */
  exportAsJSON() {
    return JSON.stringify(this.state, null, 2);
  }

  /**
   * Importa o estado de um JSON
   */
  importFromJSON(jsonString) {
    try {
      const imported = JSON.parse(jsonString);
      const candidate = imported?.state && typeof imported.state === 'object'
        ? imported.state
        : imported;
      this.state = this.prepareState(candidate);
      this.notifyObservers();
      return true;
    } catch (e) {
      console.error('Erro ao importar JSON:', e);
      return false;
    }
  }

  /**
   * Adiciona um funcionário
   */
  addFuncionario(nome = '', salario = 0, beneficios = 0) {
    this.state.funcionarios.push({
      nome: typeof nome === 'string' ? nome.slice(0, 200) : '',
      salario: this.normalizeCurrency(salario),
      beneficios: this.normalizeCurrency(beneficios)
    });
    this.notifyObservers();
  }

  /**
   * Remove um funcionário
   */
  removeFuncionario(index) {
    if (index >= 0 && index < this.state.funcionarios.length) {
      this.state.funcionarios.splice(index, 1);
      this.notifyObservers();
    }
  }

  /**
   * Atualiza um funcionário
   */
  updateFuncionario(index, nome, salario, beneficios) {
    if (index >= 0 && index < this.state.funcionarios.length) {
      this.state.funcionarios[index] = {
        nome: typeof nome === 'string' ? nome.slice(0, 200) : '',
        salario: this.normalizeCurrency(salario),
        beneficios: this.normalizeCurrency(beneficios)
      };
      this.notifyObservers();
    }
  }

  /**
   * Adiciona um contrato CT
   */
  addContratosCT(descricao = '', valor = 0) {
    this.state.contratosCT.push({ descricao, valor });
    this.notifyObservers();
  }

  /**
   * Remove um contrato CT
   */
  removeContratosCT(index) {
    if (index >= 0 && index < this.state.contratosCT.length) {
      this.state.contratosCT.splice(index, 1);
      this.notifyObservers();
    }
  }

  /**
   * Atualiza um contrato CT
   */
  updateContratosCT(index, descricao, valor) {
    if (index >= 0 && index < this.state.contratosCT.length) {
      this.state.contratosCT[index] = { descricao, valor };
      this.notifyObservers();
    }
  }

  /**
   * Adiciona um custo variável
   */
  addCustoVariavel(descricao = '', valor = 0) {
    this.state.custosVariaveis.push({ descricao, valor });
    this.notifyObservers();
  }

  /**
   * Remove um custo variável
   */
  removeCustoVariavel(index) {
    if (index >= 0 && index < this.state.custosVariaveis.length) {
      this.state.custosVariaveis.splice(index, 1);
      this.notifyObservers();
    }
  }

  /**
   * Atualiza um custo variável
   */
  updateCustoVariavel(index, descricao, valor) {
    if (index >= 0 && index < this.state.custosVariaveis.length) {
      this.state.custosVariaveis[index] = { descricao, valor };
      this.notifyObservers();
    }
  }
}

export default State;
