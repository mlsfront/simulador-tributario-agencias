/**
 * TaxCalculator.js - Cálculos tributários e de custos.
 *
 * Convenções adotadas:
 * - O simulador cobre os Anexos III e V do Simples Nacional.
 * - O valor informado em CT é a base contratual sem tributos repassados.
 * - ISS e demais tributos de CT compõem o custo CT uma única vez.
 * - A carga tributária é uma visão de composição; ela não deve ser somada
 *   novamente ao custo de operação ou ao total de despesas.
 */

import { clamp } from '../utils/formatters.js';
import RevenueProjection from './RevenueProjection.js';

const asNonNegativeNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
};

class TaxCalculator {
  constructor(state) {
    this.state = state;
  }

  /**
   * Calcula a redução mensal do IRPF de 2026 sobre o imposto já apurado.
   * A redução considera o rendimento tributável bruto, e não a base após
   * deduções, conforme os exemplos oficiais da Receita Federal.
   */
  calcReducaoIRPF(rendimentoTributavel, impostoCalculado) {
    const regra = this.state.irpf?.reducaoMensal;
    if (!regra?.ativa || impostoCalculado <= 0) return 0;

    const renda = asNonNegativeNumber(rendimentoTributavel);
    let reducao = 0;

    if (renda <= regra.limiteIntegral) {
      reducao = regra.valorMaximo;
    } else if (renda <= regra.limiteFinal) {
      reducao = regra.constante - (regra.fator * renda);
    }

    return Math.min(impostoCalculado, Math.max(0, reducao));
  }

  /**
   * Calcula o IRPF progressivo mensal, aplicando a redução legal configurada.
   */
  calcIRPF(base, rendimentoTributavel = base) {
    const baseCalculo = asNonNegativeNumber(base);
    const tabela = Array.isArray(this.state.tabelaIRPF) ? this.state.tabelaIRPF : [];
    const faixa = tabela.find((item) => item.lim === null || baseCalculo <= item.lim)
      || tabela[tabela.length - 1];

    if (!faixa) return 0;

    const impostoBruto = Math.max(0, (baseCalculo * faixa.aliq) - faixa.pd);
    return Math.max(0, impostoBruto - this.calcReducaoIRPF(rendimentoTributavel, impostoBruto));
  }

  /**
   * Calcula DAS no modo básico (alíquota simples).
   */
  calcSimplesBasico(receita, anexo) {
    const aliq = anexo === 'III'
      ? this.state.aliquotas.aliquotaIII
      : this.state.aliquotas.aliquotaV;
    return asNonNegativeNumber(receita) * asNonNegativeNumber(aliq);
  }

  /**
   * Calcula a alíquota efetiva de uma tabela progressiva.
   */
  calcAliquotaEfetiva(rbt12, tabela) {
    const receitaAcumulada = asNonNegativeNumber(rbt12);
    const faixa = tabela.find((item) => receitaAcumulada <= item.lim) || tabela[tabela.length - 1];
    if (!faixa || receitaAcumulada === 0) return 0;

    const efetiva = ((receitaAcumulada * faixa.aliq) - faixa.pd) / receitaAcumulada;
    return clamp(efetiva, 0, 1);
  }

  /**
   * Calcula DAS no modo avançado (tabela progressiva).
   */
  calcSimplesAvancado(receita, rbt12, anexo) {
    const tabela = anexo === 'III' ? this.state.tabelaIII : this.state.tabelaV;
    const aliquotaEfetiva = this.calcAliquotaEfetiva(rbt12, tabela);

    return {
      das: asNonNegativeNumber(receita) * aliquotaEfetiva,
      aliquotaEfetiva
    };
  }

  /**
   * Calcula custos do sócio (pró-labore).
   *
   * Nos Anexos III e V, únicos cenários suportados por este simulador, a CPP
   * integra o DAS. Portanto, ela não pode ser adicionada novamente ao custo
   * do pró-labore ou à carga tributária.
   */
  calcSocio(prolabore, tetoINSS) {
    const remuneracao = asNonNegativeNumber(prolabore);
    const teto = asNonNegativeNumber(tetoINSS);
    const inssEmpregado = asNonNegativeNumber(this.state.aliquotas.inssEmpregado);
    const descontoSimplificado = asNonNegativeNumber(this.state.irpf?.descontoSimplificadoMensal);

    const baseINSS = Math.min(remuneracao, teto);
    const inssSocio = baseINSS * inssEmpregado;
    const deducaoIRPF = Math.max(inssSocio, descontoSimplificado);
    const baseIRPF = Math.max(0, remuneracao - deducaoIRPF);
    const irpf = this.calcIRPF(baseIRPF, remuneracao);
    const custoPatronal = 0;
    const totalSocio = remuneracao;

    return {
      inssSocio,
      irpf,
      custoPatronal,
      totalSocio,
      baseIRPF,
      deducaoIRPF
    };
  }

  /**
   * Calcula custos de funcionários CLT.
   */
  calcCLT(funcionarios) {
    let totalCost = 0;
    let totalCharges = 0;

    const taxRate = [
      this.state.aliquotas.fgts,
      this.state.aliquotas.fgtsMulta,
      this.state.aliquotas.decimoTerceiro,
      this.state.aliquotas.ferias,
      this.state.aliquotas.inssPatronalCLT,
      this.state.aliquotas.rat
    ].reduce((total, aliquota) => total + asNonNegativeNumber(aliquota), 0);

    funcionarios.forEach((funcionario) => {
      const salario = asNonNegativeNumber(funcionario.salario);
      const beneficios = asNonNegativeNumber(funcionario.beneficios);
      const encargos = salario * taxRate;

      totalCost += salario + encargos + beneficios;
      totalCharges += encargos;
    });

    return { totalCost, totalCharges, taxRate };
  }

  /**
   * Calcula os custos de contratos CT (PJ/autônomos).
   *
   * `tributosTotal` é incluído em `custoTotal` apenas nesta etapa. A mesma
   * parcela aparece em `cargaTributaria` somente para análise de composição,
   * nunca como uma segunda soma no total de despesas.
   */
  calcCT(contratosCT) {
    const iss = asNonNegativeNumber(this.state.aliquotas.iss);
    const outrasRetencoes = asNonNegativeNumber(this.state.aliquotas.retencoes);
    const baseTotal = contratosCT.reduce(
      (total, contrato) => total + asNonNegativeNumber(contrato.valor),
      0
    );

    const issTotal = baseTotal * iss;
    const outrasRetencoesTotal = baseTotal * outrasRetencoes;
    const tributosTotal = issTotal + outrasRetencoesTotal;
    const custoTotal = baseTotal + tributosTotal;

    return {
      baseTotal,
      issTotal,
      outrasRetencoesTotal,
      tributosTotal,
      custoTotal
    };
  }

  /**
   * Calcula custos variáveis.
   */
  calcVariaveis(custosVariaveis, receita) {
    const total = custosVariaveis.reduce(
      (acumulado, custo) => acumulado + asNonNegativeNumber(custo.valor),
      0
    );
    const perc = asNonNegativeNumber(receita) > 0 ? total / receita : 0;

    return { total, perc };
  }

  /**
   * Calcula a massa salarial acumulada de 12 meses usada pelo Fator R.
   */
  calcFolha12(prolabore, funcionarios) {
    const socio = this.calcSocio(prolabore, this.state.tetoINSS);
    const clt = this.calcCLT(funcionarios);
    return (socio.totalSocio + clt.totalCost) * 12;
  }

  /**
   * Calcula o Fator R e determina o anexo aplicável.
   */
  calcFatorR(folha12, rbt12) {
    const receitaAcumulada = asNonNegativeNumber(rbt12);
    const fator = receitaAcumulada > 0 ? asNonNegativeNumber(folha12) / receitaAcumulada : 0;
    const limiar = asNonNegativeNumber(this.state.aliquotas.limiarFatorR);

    return {
      fator,
      anexo: fator >= limiar ? 'III' : 'V',
      limiar
    };
  }

  /**
   * Calcula a carga tributária como visão de composição dos tributos.
   */
  calcCargaTributaria(das, socio, clt, ct) {
    return das
      + socio.inssSocio
      + socio.irpf
      + clt.totalCharges
      + socio.custoPatronal
      + ct.tributosTotal;
  }

  /**
   * Executa todos os cálculos do simulador.
   */
  calcAll() {
    const revenueBase = RevenueProjection.resolve(this.state);
    const receita = asNonNegativeNumber(revenueBase.receitaMensal);
    const prolabore = asNonNegativeNumber(this.state.prolabore);
    const tetoINSS = asNonNegativeNumber(this.state.tetoINSS);
    const rbt12 = revenueBase.rbt12;

    const folha12 = this.calcFolha12(prolabore, this.state.funcionarios);
    const fatorRData = this.calcFatorR(folha12, rbt12);
    const anexo = fatorRData.anexo;

    let das;
    let aliquotaEfetiva;
    if (this.state.modoAvancado) {
      ({ das, aliquotaEfetiva } = this.calcSimplesAvancado(receita, rbt12, anexo));
    } else {
      das = this.calcSimplesBasico(receita, anexo);
      aliquotaEfetiva = null;
    }

    const socio = this.calcSocio(prolabore, tetoINSS);
    const clt = this.calcCLT(this.state.funcionarios);
    const ct = this.calcCT(this.state.contratosCT);
    const variaveis = this.calcVariaveis(this.state.custosVariaveis, receita);
    const cargaTributaria = this.calcCargaTributaria(das, socio, clt, ct);
    const custoOperacao = socio.totalSocio + clt.totalCost + ct.custoTotal;
    const totalDespesas = das + custoOperacao + variaveis.total;

    return {
      receita,
      rbt12,
      revenueBase,
      folha12,
      fatorR: fatorRData.fator,
      anexo,
      das,
      aliquotaEfetiva,
      socio,
      clt,
      ct,
      variaveis,
      cargaTributaria,
      custoOperacao,
      totalDespesas
    };
  }
}

export default TaxCalculator;
