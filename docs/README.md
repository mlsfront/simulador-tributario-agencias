# Documentação do Simulador Tributário e de Custos

Esta documentação descreve a versão **4.2.1** do simulador para agências web. O projeto calcula cenários mensais de receita, folha, contratos CT, custos variáveis e Simples Nacional para os Anexos III e V. Ele é uma ferramenta de simulação e conferência gerencial; não substitui a apuração formal no PGDAS-D nem a validação de um contador.

| Documento | Finalidade |
| --- | --- |
| [Contexto do projeto](../CONTEXTO_PROJETO.md) | Visão consolidada da arquitetura, regras, estado, testes e manutenção. |
| [Modelo de cálculos](MODELO-DE-CALCULOS.md) | Define as entradas, fórmulas, componentes de CT e regras de consolidação. |
| [Auditoria técnica e de cálculos](AUDITORIA-2026-08.md) | Registra problemas identificados, impacto, correções e pendências. |
| [Operação e validação](OPERACAO-E-VALIDACAO.md) | Explica como executar, testar, importar/exportar dados e manter os parâmetros. |
| [Validação no navegador](validacao-navegador.md) | Guarda as evidências da conferência funcional realizada após os ajustes. |
| [Mensagem de commit](MENSAGEM-DE-COMMIT.md) | Contém o commit Conventional Commits sugerido para esta entrega. |
| [Guia de contribuição](CONTRIBUICAO.md) | Define o fluxo seguro de manutenção, testes e documentação. |
| [Projeção e persistência](PROJECAO-E-PERSISTENCIA.md) | Explica o cronograma financeiro, histórico manual e gerenciamento do localStorage. |

## Escopo tributário

O simulador atende apenas aos cenários dos **Anexos III e V** e usa o Fator R como critério de alternância entre eles. Para atividades submetidas ao Anexo IV, a contribuição previdenciária patronal possui tratamento próprio e não deve ser inferida a partir deste projeto.[1] As alíquotas, faixas, retenções e enquadramentos devem ser revisados para cada competência, município, atividade e contrato.

> A aplicação foi estruturada para melhorar a transparência da composição dos custos. Isso não a transforma em substituta de obrigações acessórias ou de análise contábil individualizada.

## Ponto de entrada

A versão canônica está em [`src/index.html`](../src/index.html). A página [`index.html`](../index.html) na raiz é somente um redirecionamento de compatibilidade para essa versão. O arquivo duplicado `simulador.html` foi removido; materiais históricos e depreciados foram preservados em [`legacy/`](../legacy/README.md). Diretórios vazios e artefatos gerados foram removidos da estrutura ativa.

## Fonte única dos cálculos

O motor ativo de fórmulas tributárias e de custos é `src/js/models/TaxCalculator.js`. A projeção de receita é mantida separadamente em `src/js/models/RevenueProjection.js`, sem duplicar regras do motor tributário. `RevenueProjection.resolve()` define uma única base efetiva para o RBT12 e o Fator R: `projecao` quando a configuração nova está ativa ou `manual` quando o histórico de 12 meses está ativo. `State.js` não calcula tributos; ele gerencia schema, migração, histórico e persistência. A interface e as exportações consomem esses módulos, sem manter fórmulas paralelas.

A entrega recebida não possuía `.git`; por isso, não havia registros históricos locais para incluir no ZIP. O arquivo `.gitignore` mantém dependências, segredos, caches e pacotes gerados fora do versionamento futuro.

## Parâmetros de referência

A versão 4.2.1 mantém como referência o teto do INSS de **R$ 8.475,55** para a competência de janeiro de 2026 e a tabela mensal de IRPF vigente em 2026, incluindo a redução mensal prevista para rendimentos nas faixas indicadas pela Receita Federal.[2] [3] Esses dados permanecem revisáveis e exigem atualização periódica.

## Referências

[1]: https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/cobrancas-e-intimacoes/contribuicao-previdenciaria-anexo-iv-do-simples-nacional "Receita Federal — Contribuição Previdenciária no Anexo IV do Simples Nacional"
[2]: https://www.gov.br/inss/pt-br/direitos-e-deveres/inscricao-e-contribuicao/tabela-de-contribuicao-mensal "INSS — Tabela de contribuição mensal"
[3]: https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/2026 "Receita Federal — Tributação de 2026"
