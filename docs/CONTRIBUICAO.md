# Guia de contribuição e manutenção

## Princípio de manutenção

O projeto possui um **único caminho de execução**: a página pública da raiz direciona para `src/index.html`, que carrega a interface modular. Alterações de comportamento devem ser feitas nos módulos de `src/js/`, nunca por cópias de HTML ou de fórmulas em arquivos paralelos. O motor tributário e de custos é único em `TaxCalculator.js`; `RevenueProjection.js` contém apenas a regra independente de projeção de receita.

| Necessidade | Local de alteração |
| --- | --- |
| Fórmula tributária ou de custos | `src/js/models/TaxCalculator.js` |
| Parâmetro inicial, persistência ou migração | `src/js/models/State.js` |
| Projeção de setup, mensalidade e clientes | `src/js/models/RevenueProjection.js` |
| Renderização, eventos ou gráficos | `src/js/main.js` |
| Exportações | `src/js/utils/exporters.js` |
| Textos e elementos visuais | `src/index.html` e `src/css/` |
| Teste de regressão | `tests/tax-calculator.test.js` |
| Documentação | `docs/` |

## Processo recomendado

Antes de alterar uma regra, registre um cenário objetivo com entradas e saída esperada. Inclua esse cenário na suíte de testes e só então implemente a mudança. Essa ordem evita que uma alteração de texto ou de interface oculte uma regressão numérica.

Após a implementação, execute:

```bash
node --check src/js/main.js
node --check src/js/models/State.js
node --check src/js/models/TaxCalculator.js
node --check src/js/models/RevenueProjection.js
node --check src/js/utils/exporters.js
npm test
```

Em seguida, valide no navegador os valores dos cards, gráficos e exportações para o cenário alterado. Antes de empacotar, confirme que existe uma única página ativa, que `index.html` é apenas um redirecionamento e que não foram criadas fórmulas paralelas. Verifique também se não há diretórios vazios, ZIPs dentro do projeto ou segredos versionáveis; o `.gitignore` cobre os artefatos locais comuns. Uma mudança que modifique fórmulas, parâmetros iniciais ou escopo tributário deve atualizar `MODELO-DE-CALCULOS.md`, a auditoria ou o guia operacional, conforme a natureza da alteração.

## Regras de qualidade

Os resultados retornados por `TaxCalculator` devem ter nomes explícitos e devem separar componentes analíticos de componentes utilizados em totais. Não some um valor de carga tributária a um total de despesas quando esse mesmo valor já estiver embutido em DAS, custo CT ou custo CLT.

Importações e valores de `localStorage` devem passar por `State.hydrateState()`. Campos textuais inseridos na interface devem ser escapados antes de compor HTML. Quando uma alteração remover um campo da interface, verifique que a sincronização de estado não o substitui por zero nem altera inadvertidamente dados persistidos.

## Documentação e histórico

A documentação ativa está em `docs/`. O diretório `legacy/` é exclusivamente histórico e não deve receber código executável, novas funcionalidades ou referências operacionais. Se uma decisão antiga precisar ser preservada, inclua uma nota de contexto em `legacy/README.md` e registre a prática atual no documento correspondente de `docs/`.

## Mensagens de commit

Utilize o padrão Conventional Commits, em português, com tipo e escopo claros. Uma correção do motor tributário, por exemplo, pode usar:

```text
fix(calculos): corrige composição de CT e consolidação de despesas
```

Use `feat` para novas capacidades, `fix` para correções, `docs` para mudanças exclusivamente documentais, `test` para testes, `refactor` para reorganizações internas sem mudança de comportamento e `chore` para manutenção de infraestrutura.
