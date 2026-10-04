/**
 * formatters.js - Formatação e parsing de dados
 * Fornece funções para formatar valores monetários e percentuais
 */

/**
 * Formatadores Intl
 */
const fmtBRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});

const fmtPct = new Intl.NumberFormat('pt-BR', {
  style: 'percent',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

/**
 * Limita um valor entre min e max
 */
const clamp = (x, min, max) => Math.max(min, Math.min(max, x));

/**
 * Parseia um valor em BRL para número
 */
const parseBRL = (s) => {
  if (typeof s !== 'string') s = String(s || '');
  s = s.replace(/\s/g, '')
    .replace(/[Rr]\$\s?/, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const v = parseFloat(s);
  return isNaN(v) ? 0 : v;
};

/**
 * Parseia um valor em percentual para decimal
 */
const parsePct = (s) => {
  if (typeof s !== 'string') s = String(s || '');
  s = s.replace('%', '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const v = parseFloat(s);
  return isNaN(v) ? 0 : v / 100;
};

/**
 * Formata um elemento input com máscara BRL
 */
const formatBRLInput = (el) => {
  const v = parseBRL(el.value);
  el.value = fmtBRL.format(v);
  el.dataset.num = v;
};

/**
 * Formata um elemento input com máscara de percentual
 */
const formatPctInput = (el) => {
  const v = parsePct(el.value);
  el.value = fmtPct.format(v);
  el.dataset.num = v;
};

/**
 * Obtém o valor numérico de um elemento
 */
const getNum = (id) => {
  const el = document.getElementById(id);
  if (!el) return 0;
  return el.dataset.num ? parseFloat(el.dataset.num) : parseBRL(el.value);
};

/**
 * Obtém o valor percentual de um elemento
 */
const getPctNum = (id) => {
  const el = document.getElementById(id);
  if (!el) return 0;
  return el.dataset.num ? parseFloat(el.dataset.num) : parsePct(el.value);
};

/**
 * Formata um número como BRL
 */
const formatBRL = (value) => {
  return fmtBRL.format(value);
};

/**
 * Formata um número como percentual
 */
const formatPct = (value) => {
  return fmtPct.format(value);
};

/**
 * Formata um valor com indicador (valor + percentual)
 */
const formatIndicator = (value, total) => {
  const percentage = total > 0 ? (value / total) : 0;
  return `${formatBRL(value)} (${formatPct(percentage)})`;
};

/**
 * Aplica máscaras a todos os inputs
 */
const attachMasks = () => {
  document.querySelectorAll('[data-mask="currency"]:not(.has-mask)').forEach(el => {
    el.classList.add('has-mask');
    el.addEventListener('focus', () => {
      if (el.value) {
        el.value = el.value.replace(/[Rr]\$\s?/, '').replace(/\./g, '');
      }
    });
    el.addEventListener('blur', () => formatBRLInput(el));
  });

  document.querySelectorAll('[data-mask="percent"]:not(.has-mask)').forEach(el => {
    el.classList.add('has-mask');
    el.addEventListener('focus', () => {
      if (el.value) {
        el.value = el.value.replace('%', '');
      }
    });
    el.addEventListener('blur', () => formatPctInput(el));
  });
};

export {
  fmtBRL,
  fmtPct,
  clamp,
  parseBRL,
  parsePct,
  formatBRLInput,
  formatPctInput,
  getNum,
  getPctNum,
  formatBRL,
  formatPct,
  formatIndicator,
  attachMasks
};
