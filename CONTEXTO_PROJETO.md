# Contexto do Projeto

## 1. Visão geral

O **Simulador Tributário e de Custos para Agências Web** é uma aplicação web estática para simulação gerencial de receita, Fator R, Simples Nacional, pró-labore, funcionários CLT, prestadores CT/PJ e custos variáveis.

A versão atual é **4.2.1**. O projeto é executado diretamente no navegador por meio de módulos ECMAScript e não possui etapa de build obrigatória. A aplicação deve ser servida por HTTP; abrir `src/index.html` diretamente pelo sistema de arquivos pode impedir o carregamento dos módulos por restrições de origem do navegador.

> O projeto é uma ferramenta de simulação e conferência gerencial. Não substitui a apuração no PGDAS-D, a escrituração, as obrigações acessórias ou a validação de um profissional contábil.

## 2. Como executar

Na raiz do projeto, iniciar um servidor HTTP simples:

```bash
python3 -m http.server 8000
```

Acessar a interface canônica em:

```text
http://localhost:8000/src/
```

A página `index.html` da raiz é apenas um redirecionamento de compatibilidade para `src/index.html`. Não existe uma segunda implementação ativa em `simulador.html`; esse arquivo foi removido para evitar duplicidade.

Para executar a suíte automatizada:

```bash
npm test
```

Para verificar a sintaxe dos principais módulos:

```bash
node --check src/js/main.js
node --check src/js/models/State.js
node --check src/js/models/RevenueProjection.js
node --check src/js/models/TaxCalculator.js
node --check src/js/utils/exporters.js
```

## 3. Estrutura e responsabilidades

```text
.
├── src/
│   ├── index.html                 # Única interface ativa
│   ├── css/                       # Variáveis, layout e componentes visuais
│   └── js/
│       ├── main.js                # Inicialização, eventos, UI e gráficos
│       ├── models/
│       │   ├── State.js           # Estado, schema, migração e persistência
│       │   ├── TaxCalculator.js   # Motor único de tributos e custos
│       │   ├── RevenueProjection.js # Projeção e base efetiva de receita
│       │   └── PricingCalculator.js # Cálculo reverso de preço
│       └── utils/
│           ├── exporters.js       # Exportação JSON, CSV e HTML
│           ├── formatters.js      # Parsing e formatação brasileira
│           └── validators.js      # Validações auxiliares
├── tests/
│   └── tax-calculator.test.js     # Testes de regressão e integração de modelos
├── docs/                          # Documentação ativa, auditoria e evidências
├── legacy/                        # Materiais históricos que não participam da execução
├── index.html                     # Redirecionamento para src/index.html
├── CONTEXTO_PROJETO.md            # Este documento
├── .gitignore                     # Higiene do repositório
└── package.json                   # Scripts e metadados do projeto
```

## 4. Regra de fonte única

Há uma única implementação ativa para as fórmulas tributárias e de custos: `src/js/models/TaxCalculator.js`.

`RevenueProjection.js` possui responsabilidade própria porque trata a regra de receita projetada, mas não replica cálculos tributários. `RevenueProjection.resolve()` é o único ponto que resolve a origem da receita usada no RBT12 e no Fator R. `State.js` administra estado, migração e persistência; `main.js` coordena interface e eventos; `exporters.js` apenas transforma dados em relatórios; `PricingCalculator.js` trata exclusivamente a formação reversa de preço.

Não devem ser criados novos HTMLs com cálculos, fórmulas paralelas na interface ou uma segunda calculadora para os mesmos indicadores.

## 5. Fluxo da receita e do Fator R

A configuração da projeção está em `state.projecaoFinanceira`:

| Campo | Função |
| --- | --- |
| `ativa` | Define se a projeção nova é a fonte efetiva da receita. |
| `setupPorCliente` | Valor cobrado uma vez no mês de aquisição. |
| `mensalidadeRecorrente` | Valor recorrente mensal por cliente pagante. |
| `novosClientesMes` | Quantidade estimada de novos clientes por mês. |
| `mesReferencia` | Mês do cronograma usado como receita mensal corrente. |

Quando `ativa` é verdadeira, `RevenueProjection.resolve()` gera os 12 meses, calcula setup no mês de entrada e mensalidade a partir do mês seguinte, e retorna:

```text
faturamento setup = novos clientes do mês × setup por cliente
faturamento mensal = clientes dos meses anteriores × mensalidade recorrente
faturamento total = faturamento setup + faturamento mensal
```

Quando `ativa` é falsa, a única fonte é `state.receitas12m`, mantida pelo histórico manual. Nesse modo, a receita mensal é o último mês do histórico e o RBT12 é a soma dos 12 meses.

A resolução retorna `origem: "projecao"` ou `origem: "manual"`. A mesma base efetiva deve ser usada pelo `TaxCalculator`, pela interface e pelos exportadores. A interface informa a origem ao lado do Fator R para tornar o cálculo auditável.

A massa salarial anualizada usada pelo simulador é:

```text
FS12 = (pró-labore mensal + custo CLT mensal) × 12
```

O Fator R é calculado como:

```text
Fator R = FS12 ÷ RBT12
```

Quando o Fator R é igual ou superior ao limiar configurado, cujo padrão é 28%, o simulador aplica o Anexo III; caso contrário, aplica o Anexo V.

Editar a receita mensal ou qualquer mês do histórico desativa a projeção automaticamente, preservando o ajuste manual. Para retornar ao modo projetado, reativar a projeção em **Configurações Globais** e salvar os parâmetros.

## 6. Principais fórmulas de custos

O escopo tributário da aplicação cobre os Anexos III e V. O Anexo IV não é implementado.

| Componente | Regra resumida |
| --- | --- |
| DAS básico | Receita mensal × alíquota configurada do anexo. |
| DAS avançado | Receita mensal × alíquota efetiva derivada do RBT12 e da tabela progressiva. |
| Sócio | Pró-labore, INSS do contribuinte individual e IRPF configurado. |
| CLT | Salário + benefícios + salário × encargos configurados. |
| CT/PJ | Base contratual + ISS + outras retenções. |
| Variáveis | Soma dos custos variáveis cadastrados. |

O custo CT é composto por:

```text
ISS CT              = base CT × alíquota ISS
outras retenções CT = base CT × alíquota de retenções
tributos CT         = ISS CT + outras retenções CT
custo CT            = base CT + tributos CT
```

Os tributos CT aparecem separadamente na carga tributária apenas como detalhamento analítico. Como já estão dentro do custo CT, não podem ser somados novamente ao custo operacional ou ao total de despesas.

A consolidação segue:

```text
carga tributária = DAS + INSS do sócio + IRPF + encargos CLT + tributos CT + CPP adicional
custo de operação = custo do sócio + custo CLT + custo CT
total de despesas = DAS + custo de operação + custos variáveis
```

Nos Anexos III e V, `CPP adicional` permanece zero porque a aplicação considera a CPP como componente do DAS nesse escopo. O Anexo IV, que possui tratamento diferente, está fora do projeto.

## 7. Estado, persistência e importação/exportação

O estado central é criado e normalizado por `State.js`. A hidratação:

- completa campos ausentes com os padrões atuais;
- normaliza moedas, percentuais, inteiros e textos;
- preserva funcionários, contratos, custos, tabelas, histórico e projeção válidos;
- reconhece as flags booleanas `true` e `false`, inclusive quando chegam como texto;
- prepara a base efetiva antes de atualizar a interface, calcular ou desfazer.

A chave do `localStorage` é:

```text
simuladorTributarioV4
```

O snapshot local usa um envelope com versão, data e estado. A aplicação oferece **Salvar agora**, **Carregar salvo**, **Limpar salvo** e autosalvamento configurável. Limpar o snapshot não remove os dados que já estão na tela.

O exportador da interface gera um envelope JSON com a estrutura conceitual:

```json
{
  "timestamp": "...",
  "results": {},
  "state": {}
}
```

O importador aceita tanto esse envelope quanto um estado puro, extraindo `state` quando necessário e executando a hidratação antes do recálculo. Esse comportamento é essencial para preservar funcionários e demais listas no ciclo exportar → importar.

## 8. Testes e critérios de aceitação

A suíte em `tests/tax-calculator.test.js` cobre atualmente **12 testes**, incluindo:

- projeção ativa como base oficial do RBT12 e do Fator R;
- impacto da inclusão e edição de funcionário na folha e no Fator R;
- importação de projeção ativa;
- round-trip do JSON exportado pela aplicação;
- identificação da origem da receita nos relatórios;
- composição de CT sem dupla contabilização;
- ausência de CPP adicional no Anexo V;
- corte de 28% do Fator R;
- IRPF de 2026, incluindo redução integral e parcial;
- cronograma do Ano 1;
- persistência no `localStorage`;
- saneamento de estado antigo, incompleto ou inválido.

Toda alteração de fórmula, schema, persistência ou evento de funcionário deve incluir um teste de regressão. Antes da entrega, executar `npm test`, as verificações `node --check` e uma validação visual no navegador com cache busting.

## 9. Limitações conhecidas

A aplicação não implementa Anexo IV, atividades mistas, repartição de folha por atividade, regras municipais específicas de ISS, particularidades de retenção por contrato, dependentes, pensão, deduções legais completas ou obrigações acessórias. Os parâmetros tributários são configuráveis e devem ser conferidos para cada competência, município, atividade e realidade empresarial.

A massa salarial usada no Fator R é uma estimativa gerencial do modelo. O resultado não deve ser tratado como apuração fiscal automática.

## 10. Práticas de manutenção

Código ativo deve permanecer em `src/`; documentação normativa e operacional deve permanecer em `docs/`; materiais depreciados devem ser movidos para `legacy/` com indicação explícita de que não participam da execução.

Ao alterar uma regra, atualizar conjuntamente o módulo responsável, os testes, a documentação de fórmulas e a evidência de validação. Evitar mudanças que criem fontes alternativas para a mesma informação. Ao alterar o schema, preservar migração para snapshots antigos e testar estado puro e envelope exportado.

O projeto recebido não contém `.git`. Se o repositório for versionado posteriormente, commits devem agrupar código, testes e documentação relacionada e seguir as sugestões em `docs/MENSAGEM-DE-COMMIT.md`.

## 11. Documentação relacionada

- [`README.md`](README.md): visão geral, início rápido e estrutura.
- [`docs/README.md`](docs/README.md): índice da documentação ativa.
- [`docs/MODELO-DE-CALCULOS.md`](docs/MODELO-DE-CALCULOS.md): fórmulas e reconciliação dos custos.
- [`docs/PROJECAO-E-PERSISTENCIA.md`](docs/PROJECAO-E-PERSISTENCIA.md): projeção, histórico e armazenamento local.
- [`docs/OPERACAO-E-VALIDACAO.md`](docs/OPERACAO-E-VALIDACAO.md): execução, testes e checklist.
- [`docs/AUDITORIA-2026-08.md`](docs/AUDITORIA-2026-08.md): auditoria técnica e regressões corrigidas.
- [`docs/CONTRIBUICAO.md`](docs/CONTRIBUICAO.md): fluxo de contribuição e manutenção.
- [`docs/MENSAGEM-DE-COMMIT.md`](docs/MENSAGEM-DE-COMMIT.md): sugestões Conventional Commits.
