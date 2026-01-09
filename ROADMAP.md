# 🗺️ Roadmap - Melhorias Futuras

Este documento apresenta sugestões de melhorias técnicas e novas funcionalidades para o Simulador Tributário, baseadas na análise do código atual.

---

## 🔧 Melhorias Técnicas

### 1. **Refatoração: Separação de Responsabilidades (MVC/Modular)**

**Problema Atual**: Todo o código (HTML, CSS, JS) está em um único arquivo de 1350 linhas, dificultando manutenção e testes.

**Proposta**:
```
src/
├── index.html
├── css/
│   ├── variables.css
│   ├── components.css
│   └── layout.css
├── js/
│   ├── models/
│   │   ├── State.js
│   │   ├── TaxCalculator.js
│   │   └── FatorRCalculator.js
│   ├── views/
│   │   ├── UIRenderer.js
│   │   └── MaskFormatter.js
│   ├── controllers/
│   │   └── SimulatorController.js
│   └── utils/
│       ├── storage.js
│       └── validators.js
└── main.js
```

**Benefícios**:
- Código mais testável (unit tests)
- Facilita colaboração (múltiplos devs)
- Melhor organização e legibilidade
- Reutilização de componentes

**Esforço**: Médio | **Prioridade**: Alta

---

### 2. **Validação de Dados e Tratamento de Erros**

**Problema Atual**: Não há validação robusta de inputs. Valores negativos ou inválidos podem gerar cálculos incorretos.

**Proposta**:
- Validar ranges (ex: alíquotas entre 0-100%, receitas > 0)
- Mensagens de erro amigáveis ao usuário
- Sanitização de inputs antes de cálculos
- Validação de JSON importado (schema validation)

**Exemplo**:
```javascript
const validatePercentage = (value, min = 0, max = 1) => {
  if (isNaN(value) || value < min || value > max) {
    throw new ValidationError(`Percentual deve estar entre ${min*100}% e ${max*100}%`);
  }
  return value;
};
```

**Benefícios**:
- Evita cálculos incorretos
- Melhor experiência do usuário
- Dados mais confiáveis

**Esforço**: Baixo | **Prioridade**: Alta

---

### 3. **Testes Automatizados**

**Problema Atual**: Sem testes unitários ou de integração. Mudanças podem quebrar cálculos sem detecção.

**Proposta**:
- **Unit Tests**: Testar funções de cálculo isoladamente
  - `calcFatorR()`
  - `calcIRPF()`
  - `calcAliquotaEfetiva()`
  - `parseBRL()`, `parsePct()`
  
- **Integration Tests**: Testar fluxos completos
  - Adicionar funcionário → recalcular → verificar totais
  - Mudar receita → verificar migração de anexo

- **Framework sugerido**: Jest ou Vitest (para vanilla JS)

**Exemplo**:
```javascript
describe('calcFatorR', () => {
  test('deve retornar Anexo III quando Fator R >= 28%', () => {
    state.folha12 = 168000; // 28% de 600k
    state.rbt12 = 600000;
    expect(calcFatorR()).toBe('III');
  });
});
```

**Benefícios**:
- Confiança em mudanças futuras
- Documentação viva do comportamento esperado
- Detecção precoce de bugs

**Esforço**: Médio | **Prioridade**: Média

---

### 4. **Otimização de Performance**

**Problema Atual**: `calcAll()` é chamado em cada blur de input, recalculando tudo mesmo quando não necessário.

**Proposta**:
- **Memoização**: Cachear resultados de cálculos pesados
- **Cálculo Incremental**: Recalcular apenas o que mudou
- **Debounce mais inteligente**: Agrupar múltiplas mudanças

**Exemplo**:
```javascript
// Antes: recalcula tudo sempre
input.addEventListener('blur', calcAll);

// Depois: recalcula apenas o necessário
input.addEventListener('blur', () => {
  const affectedModules = getDependencies(input.id);
  recalculate(affectedModules);
});
```

**Benefícios**:
- Interface mais responsiva
- Menor consumo de CPU (importante em mobile)

**Esforço**: Médio | **Prioridade**: Baixa

---

### 5. **Acessibilidade (a11y) e SEO**

**Problema Atual**: Faltam atributos ARIA, labels semânticos e meta tags.

**Proposta**:
- Adicionar `aria-label`, `aria-describedby` em inputs
- Navegação por teclado (Tab, Enter)
- Leitores de tela (screen readers)
- Meta tags para SEO:
  ```html
  <meta name="description" content="Simulador tributário para agências web...">
  <meta name="keywords" content="simples nacional, fator r, cnae 6201-5/02">
  ```

**Benefícios**:
- Inclusão de usuários com deficiência
- Melhor ranqueamento em buscas
- Conformidade com WCAG 2.1

**Esforço**: Baixo | **Prioridade**: Média

---

## 🚀 Novas Funcionalidades

### 6. **Exportação de Relatórios (PDF/CSV/Excel)**

**Descrição**: Permitir exportar os resultados em formatos profissionais para apresentação a clientes ou contadores.

**Funcionalidades**:
- **PDF**: Relatório formatado com logo, gráficos e tabelas
  - Biblioteca sugerida: [jsPDF](https://github.com/parallax/jsPDF)
- **CSV**: Dados tabulares para análise em Excel/Google Sheets
- **Excel**: Planilha com fórmulas (usando [SheetJS](https://sheetjs.com/))

**Exemplo de Relatório PDF**:
```
┌─────────────────────────────────────────┐
│  SIMULAÇÃO TRIBUTÁRIA - Janeiro 2026   │
├─────────────────────────────────────────┤
│  Receita Mensal: R$ 18.000,00          │
│  Fator R: 31,00% → Anexo III           │
│  DAS: R$ 1.080,00 (6%)                 │
│  Carga Tributária Total: R$ 3.500,00   │
│  ...                                    │
└─────────────────────────────────────────┘
```

**Benefícios**:
- Profissionalização
- Facilita compartilhamento
- Documentação de cenários

**Esforço**: Médio | **Prioridade**: Alta

---

### 7. **Integração com APIs de Tributação**

**Descrição**: Buscar automaticamente alíquotas atualizadas e validar cálculos com APIs oficiais.

**APIs Sugeridas**:
- **Receita Federal**: Consultar tabelas do Simples Nacional vigentes
- **IBGE**: Dados de inflação para correção de tetos
- **Prefeituras**: ISS por município (via API municipal ou scraping)

**Exemplo**:
```javascript
async function fetchTabelaSimplesNacional(ano) {
  const response = await fetch(`https://api.gov.br/simples/${ano}`);
  const data = await response.json();
  state.tabelaIII = data.anexoIII;
  state.tabelaV = data.anexoV;
}
```

**Benefícios**:
- Sempre atualizado com legislação
- Reduz erro humano
- Confiabilidade aumentada

**Esforço**: Alto | **Prioridade**: Média

---

### 8. **Comparação de Cenários (Side-by-Side)**

**Descrição**: Permitir criar múltiplos cenários e compará-los lado a lado.

**Funcionalidades**:
- Salvar cenários com nomes ("Cenário Atual", "Com +2 CLT", "Sem CT")
- Visualização em tabela comparativa
- Gráficos de comparação (Chart.js ou D3.js)

**Exemplo de Interface**:
```
┌──────────────┬──────────────┬──────────────┐
│  Cenário A   │  Cenário B   │  Cenário C   │
├──────────────┼──────────────┼──────────────┤
│ DAS: 1.080   │ DAS: 1.440   │ DAS: 2.160   │
│ Fator R: 31% │ Fator R: 35% │ Fator R: 25% │
│ Anexo: III   │ Anexo: III   │ Anexo: V     │
└──────────────┴──────────────┴──────────────┘
```

**Benefícios**:
- Planejamento estratégico
- Análise de impacto de contratações
- Tomada de decisão informada

**Esforço**: Alto | **Prioridade**: Média

---

### 9. **Gráficos e Visualizações**

**Descrição**: Adicionar gráficos interativos para melhor compreensão dos dados.

**Gráficos Sugeridos**:
- **Pizza**: Distribuição da carga tributária (DAS, INSS, IRPF, Encargos)
- **Barras**: Comparação de custos (Sócio, CLT, CT, Variáveis)
- **Linha**: Evolução da receita nos 12 meses
- **Gauge**: Indicador visual do Fator R (vermelho < 28%, verde ≥ 28%)

**Biblioteca Sugerida**: [Chart.js](https://www.chartjs.org/) (leve e fácil)

**Exemplo**:
```javascript
new Chart(ctx, {
  type: 'pie',
  data: {
    labels: ['DAS', 'INSS Sócio', 'IRPF', 'Encargos CLT'],
    datasets: [{
      data: [das, inssSocio, irpf, encargosCLT],
      backgroundColor: ['#4cc9f0', '#80ffdb', '#ffd43b', '#ff6b6b']
    }]
  }
});
```

**Benefícios**:
- Melhor compreensão visual
- Identificação rápida de gargalos
- Apresentações mais impactantes

**Esforço**: Médio | **Prioridade**: Alta

---

### 10. **Modo Multi-Empresa**

**Descrição**: Gerenciar múltiplas empresas/CNPJs no mesmo simulador.

**Funcionalidades**:
- Seletor de empresa no topo
- LocalStorage separado por CNPJ
- Comparação entre empresas

**Benefícios**:
- Útil para contadores
- Gestão de holdings
- Consultores tributários

**Esforço**: Médio | **Prioridade**: Baixa

---

### 11. **Calculadora de Preço de Venda**

**Descrição**: Ferramenta reversa: "Quanto preciso cobrar para ter lucro X?"

**Fórmula**:
```
Preço = (Custos Totais + Lucro Desejado) ÷ (1 - Alíquota DAS)
```

**Interface**:
```
┌─────────────────────────────────────────┐
│  Custos Totais: R$ 15.000,00           │
│  Lucro Desejado: R$ 3.000,00 (20%)     │
│  Alíquota DAS: 6%                      │
│  ────────────────────────────────────  │
│  PREÇO MÍNIMO: R$ 19.148,94            │
└─────────────────────────────────────────┘
```

**Benefícios**:
- Precificação estratégica
- Garantia de margem
- Competitividade

**Esforço**: Baixo | **Prioridade**: Alta

---

### 12. **Histórico de Simulações (Timeline)**

**Descrição**: Salvar snapshots mensais e visualizar evolução ao longo do tempo.

**Funcionalidades**:
- Salvar estado com data/hora
- Visualizar histórico em timeline
- Comparar mês a mês

**Benefícios**:
- Análise de tendências
- Auditoria de decisões
- Planejamento de longo prazo

**Esforço**: Médio | **Prioridade**: Baixa

---

## 📅 Próximos Passos Sugeridos

### Curto Prazo (1-2 meses)
1. ✅ Refatoração modular (separar arquivos)
2. ✅ Validação de dados
3. ✅ Exportação PDF/CSV
4. ✅ Gráficos básicos (Chart.js)
5. ✅ Calculadora de preço de venda

### Médio Prazo (3-6 meses)
6. ✅ Testes automatizados
7. ✅ Comparação de cenários
8. ✅ Integração com APIs (Receita Federal)
9. ✅ Melhorias de acessibilidade

### Longo Prazo (6+ meses)
10. ✅ Modo multi-empresa
11. ✅ Histórico de simulações
12. ✅ Otimizações de performance
13. ✅ Versão PWA (Progressive Web App) para uso offline

---

## 🤝 Como Contribuir com o Roadmap

Tem uma ideia não listada aqui? Abra uma [issue](https://github.com/mlsfront/simulador-tributario-agencias/issues) com a tag `enhancement` e descreva:
- **Problema**: Qual dor você quer resolver?
- **Solução**: Como você imagina a funcionalidade?
- **Benefícios**: Por que isso é importante?

Vamos discutir e priorizar juntos! 🚀
