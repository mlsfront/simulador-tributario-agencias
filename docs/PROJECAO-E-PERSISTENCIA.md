# Projeção financeira e persistência local

## Projeção do Ano 1

A projeção financeira estima 12 meses de receita a partir de três parâmetros globais: setup por cliente, mensalidade recorrente e novos clientes por mês. O setup é reconhecido no próprio mês de entrada; a mensalidade dos clientes adquiridos começa no mês seguinte.

| Parâmetro | Padrão | Efeito |
| --- | ---: | --- |
| Setup por cliente | R$ 1.830,00 | Multiplicado pelos novos clientes do mês. |
| Mensalidade recorrente | R$ 237,77 | Multiplicada pelos clientes acumulados que já passaram do mês de entrada. |
| Novos clientes por mês | 5 | Aumenta a base de clientes e o setup de cada mês. |
| Mês de referência | 12 | Define qual mês alimenta a receita atual e o DAS mensal. |

A fórmula de cada mês é:

```text
faturamento setup = novos clientes no mês × setup por cliente
faturamento mensal = clientes dos meses anteriores × mensalidade recorrente
faturamento total = faturamento setup + faturamento mensal
```

Com os valores padrão, o cronograma produz R$ 9.150,00 no mês 1, R$ 10.338,85 no mês 2 e R$ 22.227,35 no mês 12. O total do primeiro ano é R$ 188.264,10, sendo R$ 109.800,00 de setup e R$ 78.464,10 de mensalidades.

A receita de referência inicial é o total do mês 12, e o histórico de 12 meses recebe os 12 totais projetados. O usuário pode selecionar outro mês no modal de Configurações Globais; nesse caso, a receita mensal e o DAS passam a usar o mês selecionado. Quando a projeção está ativa, `RevenueProjection.resolve()` regenera os 12 meses e essa base projetada é a única utilizada pelo RBT12 e pelo Fator R.

## Histórico manual

O bloco **Ver/Editar Histórico de 12 Meses** permanece disponível. Quando o usuário altera um mês do histórico ou a receita mensal atual, a projeção automática é desativada para preservar a entrada manual. A tabela projetada continua visível para comparação, mas deixa de substituir os valores manuais. Nesse modo, a origem exibida para o Fator R e para os relatórios é `manual`, e o RBT12 é a soma dos 12 valores do histórico.

Para reativar a projeção, abra **Configurações Globais**, ajuste ou confirme os parâmetros e marque **Atualizar automaticamente o histórico com a projeção**. Ao salvar, o histórico será regenerado e a receita mensal voltará a refletir o mês de referência selecionado.

## Gerenciamento do localStorage

O estado é armazenado localmente no navegador pela chave `simuladorTributarioV4`. O conteúdo salvo passou a incluir um envelope com versão, data de salvamento e estado da aplicação. A leitura continua compatível com snapshots antigos que armazenavam o estado diretamente, e a hidratação preenche os novos campos de projeção e persistência.

| Ação | Comportamento |
| --- | --- |
| **Salvar agora** | Grava imediatamente o estado atual, mesmo com autosalvamento desativado. |
| **Carregar salvo** | Recupera o último snapshot do navegador e reaplica a interface e os cálculos. |
| **Limpar salvo** | Remove somente o snapshot local; os dados que estão na tela permanecem. |
| **Autosalvamento** | Quando ativo, grava alterações após um debounce de um segundo. |
| **Exportar JSON** | Gera um backup portátil, recomendado antes de limpar ou importar dados. |
| **Importar JSON** | Substitui o estado atual após validação e normalização. |

O status abaixo dos controles informa se o autosalvamento está ativo e a data do último snapshot. O localStorage é específico do navegador e do perfil utilizado; portanto, não é sincronizado entre dispositivos, não é um backup remoto e pode ser removido pelo usuário ou pelo navegador.

> Recomenda-se exportar um JSON antes de limpar dados, mudar de navegador ou alterar parâmetros de projeção. O backup exportado deve ser armazenado em local seguro.

## Compatibilidade de estados

Estados anteriores à versão 4.2.0, que não possuem `projecaoFinanceira`, são tratados como históricos manuais para não substituir receitas cadastradas por uma projeção inesperada. Estados criados na versão atual possuem a projeção ativa por padrão. Flags booleanas textuais conhecidas (`"true"` e `"false"`) são normalizadas sem reativar funcionalidades por engano. Valores negativos, infinitos, não numéricos e quantidades fracionárias de clientes são normalizados antes do cálculo.

## Testes de regressão

A suíte automatizada verifica o primeiro mês sem mensalidade, o início da cobrança recorrente no segundo mês, o total anual projetado, a projeção como base do RBT12/Fator R, o impacto de funcionário novo na folha, o round-trip do JSON exportado, a identificação da origem nos relatórios e o ciclo de salvar, carregar e limpar localStorage. Execute `npm test` antes de alterar as fórmulas ou o schema de persistência.
