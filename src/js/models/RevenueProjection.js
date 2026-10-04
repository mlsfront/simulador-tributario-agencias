/**
 * RevenueProjection.js - Projeção de receita para 12 meses.
 *
 * O setup é faturado no mês de entrada. A mensalidade recorrente começa no
 * mês seguinte, conforme a regra de negócio do cronograma projetado.
 */

class RevenueProjection {
  static normalizeCurrency(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : fallback;
  }

  static normalizeInteger(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? Math.floor(number) : fallback;
  }

  static normalizeConfig(config = {}) {
    return {
      ativa: config.ativa === undefined ? true : config.ativa === true,
      setupPorCliente: this.normalizeCurrency(config.setupPorCliente),
      mensalidadeRecorrente: this.normalizeCurrency(config.mensalidadeRecorrente),
      novosClientesMes: this.normalizeInteger(config.novosClientesMes),
      mesReferencia: Math.min(12, Math.max(1, this.normalizeInteger(config.mesReferencia, 12)))
    };
  }

  static generate(config = {}) {
    const normalized = this.normalizeConfig(config);
    let clientesAcumulados = 0;

    return Array.from({ length: 12 }, (_, index) => {
      const novosClientes = normalized.novosClientesMes;
      const clientesPagandoMensalidade = index === 0 ? 0 : clientesAcumulados;
      const faturamentoSetup = novosClientes * normalized.setupPorCliente;
      const faturamentoMensal = clientesPagandoMensalidade * normalized.mensalidadeRecorrente;

      clientesAcumulados += novosClientes;

      return {
        mes: index + 1,
        novosClientes,
        clientesPagandoMensalidade,
        faturamentoSetup,
        faturamentoMensal,
        total: faturamentoSetup + faturamentoMensal
      };
    });
  }

  static applyToState(state) {
    const resolved = this.resolve(state);
    state.projecaoFinanceira = this.normalizeConfig(state.projecaoFinanceira);
    state.receitas12m = [...resolved.receitas12m];
    state.receitaMensal = resolved.receitaMensal;
    return resolved.projection;
  }

  /**
   * Resolve a única base de receita que deve alimentar RBT12 e Fator R.
   * Projeção e histórico manual são fontes mutuamente exclusivas.
   */
  static resolve(state = {}) {
    const config = this.normalizeConfig(state.projecaoFinanceira);

    if (config.ativa) {
      const projection = this.generate(config);
      const receitas12m = projection.map((month) => month.total);
      return {
        origem: 'projecao',
        config,
        projection,
        receitas12m,
        receitaMensal: receitas12m[config.mesReferencia - 1],
        rbt12: receitas12m.reduce((total, value) => total + value, 0)
      };
    }

    const receitas12m = Array.from({ length: 12 }, (_, index) => {
      const value = Number(state.receitas12m?.[index]);
      return Number.isFinite(value) && value >= 0 ? value : 0;
    });

    return {
      origem: 'manual',
      config,
      projection: null,
      receitas12m,
      receitaMensal: receitas12m[11],
      rbt12: receitas12m.reduce((total, value) => total + value, 0)
    };
  }
}

export default RevenueProjection;
