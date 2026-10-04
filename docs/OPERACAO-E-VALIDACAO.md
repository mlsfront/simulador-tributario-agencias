# Operação e validação

## Requisitos

O projeto é estático e utiliza módulos ECMAScript no navegador. Deve ser servido por HTTP; abrir o arquivo HTML diretamente no navegador pode impedir o carregamento dos módulos por restrições de origem.

| Item | Requisito |
| --- | --- |
| Navegador | Versão atual de Chrome, Firefox, Safari ou Edge. |
| Ambiente de testes | Node.js 18 ou superior. |
| Dependência visual | Chart.js carregado por CDN na página modular. |
| Entrada canônica | `src/index.html`. |

## Execução local

No diretório do projeto, inicie um servidor HTTP e abra a rota `/src/`:

```bash
python3 -m http.server 8000
```

Acesse `http://localhost:8000/src/`. A URL da raiz (`/`) é redirecionada para a versão modular. O arquivo duplicado `simulador.html` foi removido para manter apenas um ponto de entrada de cálculos.

## Testes automatizados

A suíte usa o executor nativo de testes do Node e não requer instalação de dependências adicionais.

```bash
npm test
```

Os cenários cobertos verificam a composição de CT, a ausência de CPP adicional no Anexo V, o corte de 28% do Fator R, a projeção ativa como base do RBT12/Fator R, o impacto de funcionário novo, o round-trip do JSON exportado, a origem dos relatórios, o IRPF padrão de 2026 e a hidratação de estados antigos ou inválidos. Antes de alterar regras de negócio, acrescente ao menos um teste que reproduza o comportamento esperado.

| Arquivo | Responsabilidade |
| --- | --- |
| `tests/tax-calculator.test.js` | Testes de regressão do motor de cálculos. |
| `src/js/models/TaxCalculator.js` | Fórmulas tributárias e de custos. |
| `src/js/models/State.js` | Estado inicial, persistência, importação e migração. |
| `src/js/main.js` | Sincronização da interface, gráficos e eventos. |
| `src/js/utils/exporters.js` | Relatórios JSON, CSV e HTML. |

## Projeção financeira

Em **Configurações Globais**, informe o setup por cliente, a mensalidade recorrente, os novos clientes por mês e o mês que deve alimentar a receita atual. O cronograma reconhece o setup no mês de entrada e a mensalidade a partir do mês seguinte. Os valores padrão reproduzem o cenário de 5 novos clientes, setup de R$ 1.830,00 e mensalidade de R$ 237,77.

O histórico em **Ver/Editar Histórico de 12 Meses** continua sendo a fonte manual. Ao editar um mês ou a receita atual, a projeção automática é desativada. Nesse modo, o Fator R usa somente a soma do histórico manual e a interface informa essa origem. Para voltar ao modo projetado, reative a opção no modal global e salve as configurações; o Fator R passará a usar exclusivamente os 12 meses regenerados pela configuração nova.

## Dados persistidos e importação

O estado local é salvo no `localStorage` com a chave `simuladorTributarioV4`. O snapshot inclui versão, data de salvamento e payload do estado. Ao iniciar, a aplicação hidrata campos ausentes com os padrões atuais e normaliza números inválidos ou negativos. Na importação de JSON, a mesma rotina é usada antes de atualizar a tela e aceita tanto o estado puro quanto o envelope do exportador (`{ timestamp, results, state }`).

A importação preserva valores válidos das receitas, custos, alíquotas, tabelas e parâmetros de projeção. Ela limita textos de listas a 200 caracteres e restaura valores padrão quando encontra formatos inválidos. A interface também oferece Salvar agora, Carregar salvo, Limpar salvo e um indicador do último salvamento. Ainda assim, é recomendado exportar um backup JSON antes de substituir dados existentes.

> Arquivos importados são dados de simulação. A importação não deve ser tratada como validação contábil ou fiscal do conteúdo recebido.

## Manutenção de parâmetros tributários

As referências do projeto são deliberadamente configuráveis, mas não são atualizadas automaticamente. Em cada nova competência, revise ao menos os itens abaixo.

| Parâmetro | Local de manutenção | Observação |
| --- | --- | --- |
| Teto do INSS | `State.js` e interface de pró-labore | Confirmar a competência aplicável no INSS. |
| Tabela de IRPF | `State.js` | Revisar faixas, deduções, desconto simplificado e redução mensal. |
| Alíquotas de Anexos III/V | Interface ou `State.js` | Confirmar tabela, atividade e RBT12. |
| ISS e demais retenções CT | Interface por cenário | Revisar município, serviço e contrato. |
| Encargos CLT | Interface ou `State.js` | Adaptar ao regime e às incidências efetivas. |
| Fator R | `RevenueProjection.resolve()`, histórico de receitas, pró-labore e CLT | Conferir se a origem exibida é `projecao` ou `manual` e se corresponde ao cenário escolhido. |

As tabelas e exemplos oficiais do INSS e IRPF devem ser a primeira fonte de consulta para atualizações.[1] [2] O tratamento de ISS e retenções deve observar a legislação municipal e o contrato aplicável.[3]

## Conferência manual de CT

Para conferir o card de contratos CT, use esta sequência:

1. Some os valores-base dos contratos cadastrados.
2. Calcule ISS e outras retenções sobre a base com os percentuais configurados.
3. Some base e tributos para chegar ao custo CT exibido.
4. Verifique se `Total de despesas = DAS + custo de operação + custos variáveis`.
5. Use a carga tributária apenas para visualizar os componentes tributários; não a some novamente ao total de despesas.

Por exemplo, para um contrato de R$ 2.500,00 com ISS de 3% e sem outras retenções, o card deve apresentar R$ 2.575,00. O detalhamento tributário de R$ 75,00 é parte desse custo, não uma nova despesa.

## Checklist de mudanças

Ao implementar nova regra ou modificar uma tabela, execute a sequência abaixo:

```bash
node --check src/js/main.js
node --check src/js/models/State.js
node --check src/js/models/TaxCalculator.js
npm test
```

Depois, confira no navegador um cenário com CT, outro em Anexo III e outro em Anexo V. Teste também a inclusão e edição de funcionário, a alternância entre projeção e histórico manual e a importação de um JSON exportado. Confirme que os CSV e relatórios HTML identificam a mesma origem de receita e exibem os mesmos subtotais que os cards.

## Limitações de suporte

O aplicativo não calcula o Anexo IV, não substitui PGDAS-D, não realiza transmissão a órgãos públicos e não incorpora automaticamente alterações normativas. A versão é apropriada para simulação gerencial dentro do escopo documentado, com revisão profissional antes de qualquer decisão fiscal.

## Referências

[1]: https://www.gov.br/inss/pt-br/direitos-e-deveres/inscricao-e-contribuicao/tabela-de-contribuicao-mensal "INSS — Tabela de contribuição mensal"
[2]: https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/2026 "Receita Federal — Tributação de 2026"
[3]: https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp116.htm "Planalto — Lei Complementar nº 116/2003"
