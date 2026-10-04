# Arquivos legados

Este diretório preserva materiais históricos e depreciados que não participam da execução, da manutenção corrente ou da documentação normativa da versão 4.2.1.

| Local | Conteúdo | Uso permitido |
| --- | --- | --- |
| `documentacao-depreciada/` | Roadmap, estrutura, melhorias e guia de contribuição da versão anterior. | Consulta histórica e comparação de evolução; nunca usar como fonte ativa. |

Os arquivos nesta área podem descrever arquitetura, fórmulas, prioridades ou comandos que já não correspondem ao projeto. Para manutenção ativa, utilize somente o [README principal](../README.md) e os documentos em [`docs/`](../docs/README.md).

> Nenhum arquivo em `legacy/` deve ser usado como ponto de entrada da aplicação ou como referência para alteração de cálculos sem uma revisão explícita. O único motor ativo de cálculos está em `src/js/models/TaxCalculator.js`, com a projeção financeira isolada em `src/js/models/RevenueProjection.js`.
