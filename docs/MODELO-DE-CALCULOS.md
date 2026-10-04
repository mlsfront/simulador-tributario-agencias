# Modelo de cálculos

## Objetivo e convenções

O simulador estima valores mensais de operação de uma agência web. Todos os percentuais são representados internamente em formato decimal; por exemplo, `3%` é armazenado como `0,03`. Valores ausentes, negativos ou não numéricos são normalizados antes da execução das fórmulas.

O resultado distingue duas perspectivas que não devem ser combinadas como se fossem acumuladores: **custo operacional**, que mede os desembolsos e compromissos estimados, e **carga tributária**, que mostra a parcela tributária contida nos componentes. A carga serve para análise; o total de despesas é calculado por sua própria fórmula.

| Símbolo | Significado |
| --- | --- |
| `R` | Receita mensal. |
| `RBT12` | Soma do histórico de receitas dos últimos 12 meses. |
| `FS12` | Estimativa anualizada da base de folha usada pelo simulador no Fator R. |
| `DAS` | Tributo mensal do Simples Nacional. |
| `CTbase` | Soma dos valores-base de contratos PJ/autônomos. |
| `CTtrib` | ISS e outras retenções configuradas sobre a base CT. |
| `CO` | Custo de operação. |
| `TD` | Total de despesas. |

## Fator R e Simples Nacional

A aplicação calcula `Fator R = FS12 ÷ RBT12`. O RBT12 é resolvido por `RevenueProjection.resolve()`: quando a projeção nova está ativa, usa exclusivamente os 12 meses regenerados da configuração; quando está inativa, usa exclusivamente o histórico manual. Quando o resultado é igual ou superior ao limiar configurado, cujo padrão é 28%, o Anexo III é selecionado; caso contrário, o Anexo V é usado. A origem do mecanismo do Fator R e o marco de 28% constam das orientações do Simples Nacional.[1]

No modo básico, o DAS é `R × alíquota do anexo`. No modo avançado, a alíquota efetiva segue a regra `((RBT12 × alíquota nominal) − parcela a deduzir) ÷ RBT12`; em seguida, o DAS é `R × alíquota efetiva`. A faixa correspondente é escolhida pelo RBT12 configurado.

A massa anualizada usada pelo simulador é formada por doze vezes a soma do pró-labore e do custo CLT mensal, incluindo os encargos CLT configurados. Essa é uma estimativa operacional; empresas com atividades, folhas, vínculos ou recolhimentos específicos devem confrontá-la com a apuração técnica aplicável.

## Pró-labore, INSS e IRPF

O INSS do sócio é calculado sobre o menor valor entre pró-labore e teto do INSS, usando a alíquota configurada. A versão 4.2.1 mantém como referência o teto de R$ 8.475,55, válido a partir da competência de janeiro de 2026.[2]

Para o IRPF, o sistema compara o INSS informado com o desconto simplificado mensal de R$ 607,20 e utiliza a dedução mais vantajosa. Depois aplica a tabela mensal de 2026 e, quando cabível, a redução mensal. A redução é calculada sobre o rendimento tributável mensal bruto, e não sobre a base após deduções, conforme exemplos oficiais da Receita Federal.[3] [4]

O campo de CPP patronal adicional não participa dos cálculos para os Anexos III e V. Nesses cenários, a aplicação trata a CPP como componente do DAS, evitando adicioná-la novamente ao custo do sócio ou à carga tributária. O Anexo IV, no qual a CPP não integra a alíquota comum do Simples Nacional, é explicitamente excluído do escopo.[5]

## Custos CLT

Para cada funcionário, o custo mensal é:

```text
custo CLT individual = salário + benefícios + (salário × taxa de encargos)
```

A taxa de encargos é a soma de FGTS, provisão de multa de FGTS, provisão de 13º, férias, INSS patronal e RAT. O custo total CLT é a soma dos custos individuais; os encargos CLT exibidos na carga tributária correspondem apenas à parcela de encargos, não ao salário e aos benefícios.

## Prestadores CT: composição sem duplicidade

Cada contrato CT possui um valor-base. Sobre a soma desses valores são aplicados ISS e outras retenções:

```text
ISS CT              = CTbase × alíquota de ISS
Outras retenções CT = CTbase × alíquota de outras retenções
CTtrib              = ISS CT + Outras retenções CT
Custo CT            = CTbase + CTtrib
```

`CTtrib` aparece na carga tributária para dar transparência à composição. `Custo CT` já o contém e é usado **uma única vez** no custo de operação. Assim, a exibição de tributos CT e de custo CT não cria uma segunda adição no total de despesas.

> ISS e retenções dependem do município, do serviço, do tomador e das cláusulas contratuais. A Lei Complementar nº 116 define a competência municipal do ISS e prevê hipóteses de responsabilidade/retenção; os parâmetros do simulador devem ser ajustados ao caso concreto.[6]

## Consolidação e indicadores

As fórmulas consolidadas são:

```text
Carga tributária = DAS + INSS do sócio + IRPF do sócio
                   + encargos CLT + CTtrib + CPP adicional

Custo de operação = custo do sócio + custo CLT + custo CT

Total de despesas = DAS + custo de operação + custos variáveis
```

No escopo III/V, `CPP adicional = 0`. A carga tributária não é somada à fórmula de `Total de despesas`, pois parte de seus componentes já está contida no DAS, no custo CLT ou no custo CT. Os indicadores mostram cada valor e seu percentual em relação à receita mensal.

| Exemplo com CT | Valor |
| --- | ---: |
| Base contratual | R$ 2.500,00 |
| ISS de 3% | R$ 75,00 |
| Outras retenções de 0% | R$ 0,00 |
| Custo CT utilizado no custo de operação | R$ 2.575,00 |
| Parcela CT exibida na carga tributária | R$ 75,00 |

No exemplo, R$ 75,00 aparece na visão analítica de carga e dentro dos R$ 2.575,00 do custo CT. O total de despesas usa apenas os R$ 2.575,00, e não ambos os valores.

## Referências

[1]: https://www8.receita.fazenda.gov.br/simplesnacional/noticias/NoticiaCompleta.aspx?id=415ad600-7d43-4e55-971b-55df99eefe3 "Portal do Simples Nacional — Atualização das regras do Fator R"
[2]: https://www.gov.br/inss/pt-br/direitos-e-deveres/inscricao-e-contribuicao/tabela-de-contribuicao-mensal "INSS — Tabela de contribuição mensal"
[3]: https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/2026 "Receita Federal — Tributação de 2026"
[4]: https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/exemplos-de-aplicacao-da-lei-15-270-2025 "Receita Federal — Exemplos de aplicação da Lei 15.270/2025"
[5]: https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/cobrancas-e-intimacoes/contribuicao-previdenciaria-anexo-iv-do-simples-nacional "Receita Federal — Contribuição Previdenciária no Anexo IV"
[6]: https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp116.htm "Planalto — Lei Complementar nº 116/2003"
