/**
 * validators.js - Validação de dados
 * Fornece funções para validar inputs e dados do simulador
 */

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Valida um percentual
 */
const validatePercentage = (value, min = 0, max = 1, fieldName = 'Percentual') => {
  if (typeof value !== 'number' || isNaN(value)) {
    throw new ValidationError(`${fieldName} deve ser um número válido`);
  }
  if (value < min || value > max) {
    throw new ValidationError(`${fieldName} deve estar entre ${min * 100}% e ${max * 100}%`);
  }
  return value;
};

/**
 * Valida um valor monetário
 */
const validateCurrency = (value, min = 0, fieldName = 'Valor') => {
  if (typeof value !== 'number' || isNaN(value)) {
    throw new ValidationError(`${fieldName} deve ser um número válido`);
  }
  if (value < min) {
    throw new ValidationError(`${fieldName} não pode ser menor que R$ ${min.toFixed(2)}`);
  }
  return value;
};

/**
 * Valida um salário
 */
const validateSalary = (value, fieldName = 'Salário') => {
  return validateCurrency(value, 0, fieldName);
};

/**
 * Valida um nome
 */
const validateName = (value, fieldName = 'Nome', minLength = 1, maxLength = 100) => {
  if (typeof value !== 'string') {
    throw new ValidationError(`${fieldName} deve ser um texto`);
  }
  if (value.trim().length < minLength) {
    throw new ValidationError(`${fieldName} deve ter pelo menos ${minLength} caractere(s)`);
  }
  if (value.length > maxLength) {
    throw new ValidationError(`${fieldName} não pode ter mais de ${maxLength} caracteres`);
  }
  return value.trim();
};

/**
 * Valida uma descrição
 */
const validateDescription = (value, fieldName = 'Descrição', minLength = 1, maxLength = 200) => {
  return validateName(value, fieldName, minLength, maxLength);
};

/**
 * Valida um funcionário
 */
const validateFuncionario = (funcionario) => {
  if (!funcionario || typeof funcionario !== 'object') {
    throw new ValidationError('Funcionário deve ser um objeto válido');
  }

  const { nome, salario, beneficios } = funcionario;

  validateName(nome || '', 'Nome do funcionário', 1, 100);
  validateSalary(salario || 0, 'Salário');
  validateCurrency(beneficios || 0, 0, 'Benefícios');

  return funcionario;
};

/**
 * Valida um contrato CT
 */
const validateContratosCT = (contrato) => {
  if (!contrato || typeof contrato !== 'object') {
    throw new ValidationError('Contrato deve ser um objeto válido');
  }

  const { descricao, valor } = contrato;

  validateDescription(descricao || '', 'Descrição do contrato');
  validateCurrency(valor || 0, 0, 'Valor do contrato');

  return contrato;
};

/**
 * Valida um custo variável
 */
const validateCustoVariavel = (custo) => {
  if (!custo || typeof custo !== 'object') {
    throw new ValidationError('Custo variável deve ser um objeto válido');
  }

  const { descricao, valor } = custo;

  validateDescription(descricao || '', 'Descrição do custo');
  validateCurrency(valor || 0, 0, 'Valor do custo');

  return custo;
};

/**
 * Valida uma tabela de alíquotas
 */
const validateTabela = (tabela, fieldName = 'Tabela') => {
  if (!Array.isArray(tabela)) {
    throw new ValidationError(`${fieldName} deve ser um array`);
  }

  tabela.forEach((row, idx) => {
    if (!row || typeof row !== 'object') {
      throw new ValidationError(`${fieldName}[${idx}] deve ser um objeto válido`);
    }

    const { lim, aliq, pd } = row;

    if (typeof lim !== 'number' || lim < 0) {
      throw new ValidationError(`${fieldName}[${idx}].lim deve ser um número não-negativo`);
    }

    if (typeof aliq !== 'number' || aliq < 0 || aliq > 1) {
      throw new ValidationError(`${fieldName}[${idx}].aliq deve estar entre 0 e 1`);
    }

    if (typeof pd !== 'number' || pd < 0) {
      throw new ValidationError(`${fieldName}[${idx}].pd deve ser um número não-negativo`);
    }
  });

  return tabela;
};

/**
 * Valida o estado completo
 */
const validateState = (state) => {
  if (!state || typeof state !== 'object') {
    throw new ValidationError('Estado deve ser um objeto válido');
  }

  const { receitaMensal, prolabore, tetoINSS, aliquotas, funcionarios, contratosCT, custosVariaveis } = state;

  validateCurrency(receitaMensal || 0, 0, 'Receita mensal');
  validateCurrency(prolabore || 0, 0, 'Pró-labore');
  validateCurrency(tetoINSS || 0, 0, 'Teto INSS');

  if (aliquotas && typeof aliquotas === 'object') {
    Object.entries(aliquotas).forEach(([key, value]) => {
      validatePercentage(value || 0, 0, 1, `Alíquota ${key}`);
    });
  }

  if (Array.isArray(funcionarios)) {
    funcionarios.forEach((f, idx) => {
      try {
        validateFuncionario(f);
      } catch (e) {
        throw new ValidationError(`Funcionário ${idx}: ${e.message}`);
      }
    });
  }

  if (Array.isArray(contratosCT)) {
    contratosCT.forEach((c, idx) => {
      try {
        validateContratosCT(c);
      } catch (e) {
        throw new ValidationError(`Contrato ${idx}: ${e.message}`);
      }
    });
  }

  if (Array.isArray(custosVariaveis)) {
    custosVariaveis.forEach((cv, idx) => {
      try {
        validateCustoVariavel(cv);
      } catch (e) {
        throw new ValidationError(`Custo variável ${idx}: ${e.message}`);
      }
    });
  }

  return state;
};

/**
 * Sanitiza um valor de entrada
 */
const sanitizeInput = (value) => {
  if (typeof value === 'string') {
    return value.trim().replace(/[<>\"']/g, '');
  }
  return value;
};

export {
  ValidationError,
  validatePercentage,
  validateCurrency,
  validateSalary,
  validateName,
  validateDescription,
  validateFuncionario,
  validateContratosCT,
  validateCustoVariavel,
  validateTabela,
  validateState,
  sanitizeInput
};
