# Auditoria técnica e de cálculos — agosto de 2026

## Escopo

A auditoria revisou o simulador modular, as duas páginas legadas distribuídas na raiz, a persistência de estado, a composição dos cards de CT e despesas, os gráficos e os relatórios de exportação. O foco prioritário foi a confiança nos valores de **Indicadores e Despesas**, em especial a aparente sobreposição entre custo CT, ISS e retenções.

## Síntese executiva

A investigação identificou uma inconsistência de modelagem e de comunicação: os tributos de CT eram apresentados como retenções na carga tributária e, ao mesmo tempo, o ISS era embutido no custo CT. Embora `Total de Despesas` não adicionasse a carga tributária como uma linha adicional, a apresentação não permitia reconciliar os valores e as outras retenções sequer integravam o custo CT. Isso produzia a aparência de dupla soma e tornava o resultado difícil de auditar.

Também foi identificado que o custo patronal de pró-labore era aplicado no Anexo V, apesar de o simulador limitar seu escopo aos Anexos III e V; nessa situação, a CPP não deve ser acrescentada separadamente ao DAS. O projeto ainda usava parâmetros anteriores à competência de 2026 para teto do INSS e IRPF, mantinha três implementações de cálculo e recriava os gráficos por completo em cada recálculo.

| Severidade | Achados antes da correção | Situação atual |
| --- | --- | --- |
| Crítica | CPP adicional no Anexo V, sobrepondo-se ao DAS no escopo adotado. | Corrigido: CPP adicional é zero nos Anexos III/V. |
| Alta | CT dividia ISS e outras retenções de modo inconsistente; os cards induziam leitura de soma dupla. | Corrigido: componentes explícitos e inclusão única no custo CT. |
| Alta | Parâmetros de INSS e IRPF desatualizados para 2026. | Corrigido: teto, tabela, desconto simplificado e redução mensal atualizados. |
| Média | Três versões com cálculos duplicados e potencial de divergência. | Corrigido: entradas legadas redirecionam à versão modular canônica. |
| Média | Estado importado ou persistido era aceito sem hidratação e poderia quebrar fórmulas. | Corrigido: migração, normalização e limites de dados. |
| Média | Gráficos eram destruídos e recriados em cada alteração. | Corrigido: instância única atualizada sem animação. |
| Baixa | Textos e rótulos divergiam do escopo efetivo e a última faixa de IRPF surgia como R$ 0,00. | Corrigido: rótulos revisados e faixa aberta não editável. |
| Alta | Não havia projeção configurável de setup, mensalidade e aquisição de clientes. | Corrigido: cronograma do Ano 1 com mês de referência e preservação do histórico manual. |
| Média | As tabelas dos Anexos III/V ficavam comprimidas no card avançado. | Corrigido: grid dedicado, largura mínima, inputs fluidos e rolagem horizontal. |
| Média | O localStorage salvava automaticamente sem status, carregamento explícito ou limpeza seletiva. | Corrigido: salvar/carregar/limpar, metadados, status e opção de autosalvamento. |
| Alta | O Fator R consumia `receitas12m` sem garantir que a projeção ativa fosse a origem efetiva. | Corrigido: `RevenueProjection.resolve()` escolhe exclusivamente projeção ou histórico manual. |
| Crítica | Importação JSON tratava o envelope `{ timestamp, results, state }` como estado puro e podia perder listas e configurações. | Corrigido: o importador extrai e hidrata `state` antes do recálculo. |
| Média | Flags booleanas textuais podiam reativar projeção, autosalvamento ou modo avançado durante a hidratação. | Corrigido: normalização explícita de booleanos e teste de regressão. |

## Achados detalhados e correções

### 1. Contratos CT, ISS e retenções

**Causa raiz.** A implementação original calculava `retTotal = base × (ISS + retenções)`, porém calculava o custo CT como `base + (base × ISS)`. Assim, a carga tributária exibia ISS e demais retenções, enquanto o custo operacional continha apenas o ISS. Em consequência, a interface mostrava um custo CT já acrescido de ISS ao lado de uma carga que exibia o mesmo ISS, sem explicar que a carga era analítica. Além disso, as demais retenções não tinham comportamento consistente no total de despesas.

**Correção.** O domínio CT passou a expor cinco valores: base contratual, ISS, outras retenções, tributos totais e custo CT total. A fórmula única é `custo CT = base + ISS + outras retenções`. O custo CT entra uma vez no custo de operação e no total de despesas. Os tributos CT aparecem separadamente apenas como detalhamento da carga tributária, com textos explicativos na interface e nas exportações.

**Efeito verificável.** Com base CT de R$ 2.500,00, ISS de 3% e demais retenções em 0%, o custo CT é R$ 2.575,00. A carga exibe R$ 75,00 como tributos CT, mas o total de despesas usa R$ 2.575,00 uma única vez.

### 2. CPP adicional no Anexo V

**Causa raiz.** A função de pró-labore adicionava 20% de custo patronal quando o Fator R selecionava o Anexo V. Ao mesmo tempo, o DAS era calculado com a alíquota do Anexo V. Como o projeto não suporta Anexo IV, esse custo adicional gerava superestimação e diminuía a rastreabilidade do total.

**Correção.** O custo patronal adicional foi zerado nos Anexos III/V e removido como entrada editável da interface. A CPP adicional aparece apenas como zero, com aviso de que o Anexo IV não é suportado. A Receita Federal diferencia o Anexo IV ao informar que a CPP não está incluída no DAS nessa hipótese, em contraste com os demais anexos tratados pelo simulador.[1]

### 3. Atualização de parâmetros de 2026

**Causa raiz.** O teto de INSS estava em R$ 7.500,00 e a tabela de IRPF correspondia a valores anteriores. O cálculo de IRPF também ignorava a escolha entre desconto simplificado e INSS e a redução mensal de 2026.

**Correção.** O teto passou a R$ 8.475,55. A tabela mensal do IRPF foi atualizada e a calculadora aplica a maior dedução entre INSS e desconto simplificado de R$ 607,20, seguida da redução mensal quando aplicável. O comportamento reproduz os parâmetros e exemplos publicados para 2026.[2] [3]

### 4. Duplicação de código e divergência de entradas

**Causa raiz.** `index.html` e `simulador.html` continham cópias completas, legadas e independentes da lógica, incluindo as fórmulas de CT. Qualquer ajuste aplicado apenas à estrutura modular deixaria duas versões incorretas disponíveis.

**Correção.** O arquivo `simulador.html` foi removido. A página `index.html` da raiz permaneceu somente como redirecionamento de compatibilidade para `src/`, que passou a ser o único ponto de manutenção e distribuição de cálculos. A documentação anterior foi preservada em `legacy/` para consulta histórica.

### 5. Integridade de dados e segurança de interface

**Causa raiz.** Estados de `localStorage` e JSON importados eram adotados diretamente, sem completar campos novos, validar formatos ou eliminar números inválidos. Campos de nome e descrição eram interpolados em HTML sem escape.

**Correção.** O estado agora hidrata listas, tabelas e configurações a partir de um schema padrão; normaliza valores monetários e percentuais; mantém compatibilidade com estados anteriores; e limita textos. A renderização de nome e descrição aplica escape de HTML antes de inserir os valores em atributos.

### 6. Projeção financeira

**Causa raiz.** A receita mensal e o histórico eram preenchidos por valores fixos ou manualmente, sem representar o ciclo de entrada de clientes, setup e início posterior da mensalidade recorrente.

**Correção.** Foi criado o módulo `RevenueProjection`, com configuração de setup por cliente, mensalidade recorrente, novos clientes por mês e mês de referência. O cronograma mantém o histórico manual disponível; qualquer edição manual desativa a substituição automática até que o usuário reative a projeção nas Configurações Globais.

### 7. Tabelas dos Anexos III e V

**Causa raiz.** As duas tabelas progressivas eram colocadas em colunas genéricas de largura igual dentro de um container limitado, e os inputs não tinham largura mínima ou rolagem própria.

**Correção.** O modo avançado passou a usar um grid específico, cards independentes, inputs fluidos, largura mínima de tabela e rolagem horizontal. Em telas menores, as tabelas são empilhadas.

### 8. Gerenciamento do localStorage

**Causa raiz.** O estado era salvo por debounce, sem informar a última gravação, sem oferecer carregar/limpar seletivamente e sem distinguir autosalvamento de backup.

**Correção.** O estado salvo agora possui versão, data e payload compatível com snapshots antigos. A interface oferece Salvar agora, Carregar salvo, Limpar salvo e toggle de autosalvamento, mantendo os dados atuais na tela ao limpar o snapshot.

### 9. Desempenho dos gráficos

**Causa raiz.** Cada cálculo criava uma nova instância de `TaxCalculator`, destruía os dois gráficos Chart.js e criava ambos novamente. Esse custo se repetia a cada alteração de campo, apesar de o resultado já estar disponível no ciclo atual.

**Correção.** A atualização de gráficos passou a receber o resultado calculado por `calcAll()` e a chamar `chart.update('none')` nas instâncias existentes. Isso elimina recálculos redundantes e reduz alocação de objetos e repinturas.

## Pendências e limites conhecidos

O simulador não implementa o Anexo IV, atividades mistas, repartição de folha por atividade, regras municipais específicas de ISS, particularidades de retenção por tipo de tomador, dependentes, pensão, deduções legais completas ou obrigações acessórias. A aplicação também usa uma alíquota configurável de 11% para INSS do sócio/contribuinte individual; situações que exijam outra forma de contribuição devem ser parametrizadas e conferidas profissionalmente.

A massa salarial usada no Fator R é uma estimativa gerencial. A definição legal e os componentes aceitos devem ser conferidos com a documentação contábil e com a interpretação aplicável à empresa. A partir de alterações legais, é necessário revisar dados padrão, tabelas e regras antes do uso em nova competência.

## Verificações executadas

| Verificação | Resultado |
| --- | --- |
| Sintaxe dos módulos alterados | Aprovada com `node --check`. |
| Testes automatizados | **12 testes aprovados** com `npm test`, incluindo projeção → Fator R, funcionário → Fator R, round-trip JSON e origem dos relatórios. |
| Cenário CT com ISS e retenções | Aprovado; CT entra uma única vez nas despesas. |
| Cenário de Anexo V | Aprovado; CPP adicional permanece zero. |
| Limite de Fator R de 28% | Aprovado; seleciona Anexo III. |
| IRPF de 2026, redução integral e parcial | Aprovado; cobre pró-labore de até R$ 5 mil e a faixa entre R$ 5 mil e R$ 7.350. |
| Cronograma financeiro do Ano 1 | Aprovado; confere setup, início da mensalidade no mês 2 e total anual. |
| Ciclo de localStorage | Aprovado; salva, carrega, informa metadados e limpa snapshot. |
| Estado antigo ou incompleto | Aprovado; hidratação elimina valores inválidos. |
| Validação visual e console | Aprovada; cards, gráficos, funcionário adicionado e importação real renderizados sem erros no console após cache busting. |

## Referências

[1]: https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/cobrancas-e-intimacoes/contribuicao-previdenciaria-anexo-iv-do-simples-nacional "Receita Federal — Contribuição Previdenciária no Anexo IV do Simples Nacional"
[2]: https://www.gov.br/inss/pt-br/direitos-e-deveres/inscricao-e-contribuicao/tabela-de-contribuicao-mensal "INSS — Tabela de contribuição mensal"
[3]: https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/2026 "Receita Federal — Tributação de 2026"

### 10. Limpeza estrutural e versionamento

A inspeção final confirmou que o projeto recebido não possuía diretório `.git`; portanto, não havia histórico local disponível para ser preservado no pacote ZIP. O arquivo `index.html` da raiz permanece apenas como redirecionamento de compatibilidade para `src/index.html`, que é a única interface ativa. O arquivo duplicado `simulador.html` não existe, o diretório vazio `src/js/views` foi removido e não há ZIPs dentro do projeto.

A fonte única das fórmulas tributárias e de custos permanece `src/js/models/TaxCalculator.js`. A regra de projeção está isolada em `src/js/models/RevenueProjection.js`, sem duplicar o motor tributário. O `.gitignore` foi adicionado para evitar que dependências, segredos, caches e pacotes gerados sejam versionados acidentalmente.


## 11. Regressões do Fator R, funcionários e importação — versão 4.2.1

A revisão posterior identificou que o `TaxCalculator` usava somente `state.receitas12m` e não resolvia diretamente a configuração da projeção nova. Isso permitia que a projeção estivesse marcada como ativa enquanto o RBT12 e o Fator R permaneciam baseados em um histórico antigo ou inconsistente.

A correção criou `RevenueProjection.resolve()`, que retorna a origem (`projecao` ou `manual`), os 12 valores efetivos, a receita de referência e o RBT12. A projeção ativa é regenerada a partir de setup, mensalidade, clientes e mês de referência; o modo manual usa exclusivamente o histórico dos 12 meses. O `TaxCalculator`, a interface e os exportadores passaram a consumir a mesma resolução. A interface também exibe a origem da base junto ao Fator R.

Foi confirmado um segundo defeito no round-trip: `ReportExporter.exportToJSON()` gera o envelope `{ timestamp, results, state }`, enquanto `State.importFromJSON()` tratava o envelope inteiro como se fosse o estado. A importação passou a extrair `payload.state` e a hidratar o estado completo antes de recalcular. O fluxo preserva funcionários, contratos CT, custos, alíquotas, tabelas, projeção e histórico.

O fluxo de funcionários foi reforçado com normalização em `addFuncionario()` e `updateFuncionario()`. A edição de salário e benefícios passa pelo método central do estado antes do recálculo, evitando que a renderização mantenha lógica paralela. A validação visual confirmou a inclusão de funcionário, a alteração da folha e a atualização imediata do Fator R.

Também foram corrigidas flags booleanas persistidas como texto, como `"false"`, que poderiam reativar projeção, autosalvamento ou modo avançado. O reset passa pelo mesmo preparo do estado usado por importação, localStorage e undo. A aplicação foi validada com cache busting para evitar falsos positivos de módulos antigos no navegador.
