/**
 * PricingCalculator.js - Calculadora de preço de venda
 * Ferramenta reversa para calcular o preço mínimo de venda
 */

class PricingCalculator {
  /**
   * Calcula o preço mínimo de venda
   * Fórmula: Preço = (Custos Totais + Lucro Desejado) ÷ (1 - Alíquota DAS)
   */
  static calcPrecoMinimo(custosTotais, lucroDesejado, aliquotaDAS) {
    if (aliquotaDAS >= 1) {
      throw new Error('Alíquota DAS não pode ser 100% ou maior');
    }

    const precoMinimo = (custosTotais + lucroDesejado) / (1 - aliquotaDAS);
    return precoMinimo;
  }

  /**
   * Calcula o lucro resultante de um preço de venda
   * Fórmula: Lucro = (Preço × (1 - Alíquota DAS)) - Custos Totais
   */
  static calcLucroResultante(precoVenda, custosTotais, aliquotaDAS) {
    const receita = precoVenda * (1 - aliquotaDAS);
    const lucro = receita - custosTotais;
    return lucro;
  }

  /**
   * Calcula a margem de lucro
   * Fórmula: Margem = Lucro / Receita Líquida
   */
  static calcMargem(lucro, precoVenda, aliquotaDAS) {
    const receita = precoVenda * (1 - aliquotaDAS);
    if (receita <= 0) return 0;
    return lucro / receita;
  }

  /**
   * Calcula o ponto de equilíbrio
   * Fórmula: Preço = Custos Totais / (1 - Alíquota DAS)
   */
  static calcPontoEquilibrio(custosTotais, aliquotaDAS) {
    if (aliquotaDAS >= 1) {
      throw new Error('Alíquota DAS não pode ser 100% ou maior');
    }

    return custosTotais / (1 - aliquotaDAS);
  }

  /**
   * Calcula análise completa de preço
   */
  static calcAnaliseCompleta(custosTotais, lucroDesejado, aliquotaDAS, precoVenda = null) {
    // Se preço não foi fornecido, calcula o preço mínimo
    if (precoVenda === null) {
      precoVenda = this.calcPrecoMinimo(custosTotais, lucroDesejado, aliquotaDAS);
    }

    const pontoEquilibrio = this.calcPontoEquilibrio(custosTotais, aliquotaDAS);
    const receita = precoVenda * (1 - aliquotaDAS);
    const das = precoVenda * aliquotaDAS;
    const lucroResultante = receita - custosTotais;
    const margem = this.calcMargem(lucroResultante, precoVenda, aliquotaDAS);

    return {
      custosTotais,
      lucroDesejado,
      aliquotaDAS,
      precoVenda,
      pontoEquilibrio,
      receita,
      das,
      lucroResultante,
      margem,
      percentualMargem: margem * 100,
      acimaPontoEquilibrio: precoVenda > pontoEquilibrio,
      diferencaPontoEquilibrio: precoVenda - pontoEquilibrio
    };
  }

  /**
   * Valida se o preço é viável
   */
  static validarPreco(precoVenda, custosTotais, aliquotaDAS) {
    const pontoEquilibrio = this.calcPontoEquilibrio(custosTotais, aliquotaDAS);

    return {
      isValido: precoVenda >= pontoEquilibrio,
      pontoEquilibrio,
      diferencaMinima: precoVenda - pontoEquilibrio,
      percentualAcima: ((precoVenda - pontoEquilibrio) / pontoEquilibrio) * 100
    };
  }
}

export default PricingCalculator;
