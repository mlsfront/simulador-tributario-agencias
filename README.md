# Simulador Tributário e de Custos para Agências Web

Aplicação web estática para simulação gerencial de receita, Fator R, Simples Nacional, pró-labore, funcionários CLT, prestadores CT e custos variáveis. A versão atual é **4.2.1** e centraliza os cálculos na arquitetura modular de `src/`.

> O simulador é um instrumento de apoio e transparência gerencial. Não substitui a apuração no PGDAS-D, a escrituração ou a validação de um profissional contábil.

## Principais melhorias da série 4.2.x

### Correções de confiabilidade da versão 4.2.1

A versão 4.2.1 corrige regressões do fluxo de receita e persistência. `RevenueProjection.resolve()` passou a definir a única base efetiva do RBT12 e do Fator R: projeção nova quando ativa ou histórico manual quando desativada. O Fator R, a interface e os exportadores consomem a mesma origem.

A importação agora entende o envelope produzido pelo exportador JSON e preserva o estado completo, incluindo funcionários, contratos, custos, tabelas e configurações. A inclusão e edição de funcionários atualiza a folha e o Fator R através do estado central. A hidratação também trata flags booleanas textuais sem reativar recursos por engano, e a cobertura subiu para 12 testes de regressão.

A composição de contratos CT foi revisada para separar base contratual, ISS, demais retenções e custo total, eliminando a ambiguidade que sugeria dupla soma no card de despesas. O total de despesas usa o custo CT, já com seus tributos, uma única vez.

O custo patronal adicional de pró-labore não é mais somado nos cenários de Anexos III e V, pois a aplicação trata a CPP como componente do DAS nesse escopo. O Anexo IV não é suportado. A aplicação também atualizou referências de INSS e IRPF para 2026, introduziu migração segura de estado, testes automatizados e atualização incremental dos gráficos.

A versão 4.2.0 acrescenta um cronograma financeiro configurável para 12 meses. O usuário informa setup por cliente, mensalidade recorrente, novos clientes por mês e o mês usado como receita atual. O setup entra no mês de aquisição e a mensalidade começa no mês seguinte. O histórico manual permanece disponível e desativa a projeção automática quando editado.

| Área | Implementação atual |
| --- | --- |
| Cálculos | Motor único `TaxCalculator`; projeção isolada em `RevenueProjection`; base efetiva resolvida uma única vez e protegida por testes. |
| Entrada pública | `src/index.html`; `index.html` na raiz apenas redireciona para essa rota. |
| Contratos CT | Base + ISS + outras retenções, contabilizados uma única vez no custo CT. |
| IRPF | Tabela mensal de 2026, desconto simplificado e redução mensal configurados. |
| Persistência | Hidratação, metadados e controles explícitos de salvar, carregar e limpar estado local. |
| Projeção | Cronograma de setup, mensalidade e aquisição de clientes para o Ano 1. |
| Gráficos | Instâncias reutilizadas, sem recriação a cada recálculo. |
| Documentação | Índice e guias organizados em [`docs/`](docs/README.md). |

## Início rápido

O projeto precisa ser servido por HTTP para carregar módulos ECMAScript.

```bash
python3 -m http.server 8000
```

Abra `http://localhost:8000/src/` no navegador. Para rodar as verificações automatizadas, use:

```bash
npm test
```

## Estrutura do projeto

```text
.
├── src/
│   ├── index.html                 # Interface modular canônica
│   ├── css/                       # Estilos da aplicação
│   └── js/
│       ├── main.js                # Eventos, UI e gráficos
│       ├── models/
│       │   ├── State.js           # Estado, persistência e migração
│       │   ├── TaxCalculator.js   # Motor único de fórmulas tributárias e custos
│       │   ├── RevenueProjection.js # Projeção de receita de 12 meses
│       │   └── PricingCalculator.js
│       └── utils/
│           ├── exporters.js       # Exportação JSON, CSV e HTML
│           └── formatters.js      # Parsing e formatação
├── tests/
│   └── tax-calculator.test.js     # Testes de regressão
├── docs/                          # Documentação técnica e de auditoria
├── index.html                     # Redirecionamento à versão canônica
├── legacy/                        # Materiais históricos e depreciados
├── .gitignore                     # Higiene do repositório e artefatos locais
└── package.json                   # Comandos de teste
```

## Regra de fonte única

Existe uma única implementação ativa das fórmulas tributárias e de custos: `src/js/models/TaxCalculator.js`. A projeção financeira possui um módulo próprio (`src/js/models/RevenueProjection.js`) porque é uma regra de receita independente, mas não replica o motor tributário. `RevenueProjection.resolve()` é a única resolução de base de receita e retorna origem `projecao` ou `manual` para RBT12, Fator R, interface e exportações. `State.js` apenas gerencia estado, migração e persistência; `main.js` coordena a interface; `PricingCalculator.js` trata exclusivamente o preço de venda.

A página `src/index.html` é a única interface ativa. O `index.html` da raiz é um redirecionamento mínimo de compatibilidade, não uma segunda implementação. Não devem ser criados novos arquivos HTML ou calculadoras paralelas fora dessa divisão.

## Git e pacotes de entrega

A cópia recebida não contém um diretório `.git`, portanto não há histórico local a preservar no ZIP atual. O `.gitignore` foi incluído para impedir que dependências, segredos, caches e pacotes gerados sejam incorporados acidentalmente. Quando o projeto for versionado, os commits devem acompanhar código, testes e documentação, usando as sugestões em [`docs/MENSAGEM-DE-COMMIT.md`](docs/MENSAGEM-DE-COMMIT.md).

## Documentação

O ponto inicial recomendado para onboarding e manutenção é [`CONTEXTO_PROJETO.md`](CONTEXTO_PROJETO.md), na raiz. A documentação detalhada está em [`docs/README.md`](docs/README.md). Os documentos principais são:

| Documento | Conteúdo |
| --- | --- |
| [Modelo de cálculos](docs/MODELO-DE-CALCULOS.md) | Fórmulas, convenções e reconciliação de CT. |
| [Auditoria técnica e de cálculos](docs/AUDITORIA-2026-08.md) | Achados, impacto, correções, evidências e limites. |
| [Operação e validação](docs/OPERACAO-E-VALIDACAO.md) | Execução local, testes e atualização de parâmetros. |
| [Validação no navegador](docs/validacao-navegador.md) | Evidências de conferência funcional. |
| [Guia de contribuição](docs/CONTRIBUICAO.md) | Padrões de manutenção, testes e documentação. |
| [Projeção e persistência](docs/PROJECAO-E-PERSISTENCIA.md) | Fontes do Fator R, cronograma, histórico manual e importação/exportação. |

## Escopo e atualizações necessárias

A aplicação cobre os Anexos III e V em cenário de agência web. Enquadramento, Fator R, ISS, retenções, folha e tabelas tributárias dependem da realidade da empresa, da competência e do município. Antes de utilizar qualquer resultado, revise os parâmetros e consulte as referências oficiais e a assessoria contábil. Documentos preservados de versões anteriores estão em [`legacy/`](legacy/README.md) e não devem orientar alterações no código ativo.

## Licença

Consulte [LICENSE](LICENSE).
