# Changelog

Todas as alterações relevantes deste projeto estão documentadas neste arquivo.

## [Unreleased]

### Corrigido

#### Cálculos e confiabilidade

- Contabilização de ISS e outras retenções de CT uma única vez no custo operacional.
- Remoção do CPP adicional dos cenários dos Anexos III e V.
- Atualização das referências de INSS e IRPF para 2026.
- Centralização das entradas na versão modular.
- Redução da recriação desnecessária de gráficos.
- Inclusão de testes de regressão.
- Hidratação segura do estado da aplicação.
- Inclusão de documentação técnica.

#### Interface, tabelas e persistência

- Aplicação de grid responsivo e rolagem nas tabelas dos Anexos III e V.
- Inclusão das ações de salvar, carregar e limpar o estado local.
- Exibição do status do `localStorage`.
- Inclusão da opção de ativar ou desativar o autosalvamento no modal global.
- Preservação da compatibilidade com snapshots anteriores.

#### Fator R e persistência

- Unificação da base de receita utilizada no cálculo do Fator R.
- Uso mutuamente exclusivo da projeção ativa ou do histórico manual como fonte de receita.
- Recalculo de RBT12, receita de referência e Fator R a partir da mesma base efetiva.
- Correção da importação do envelope JSON exportado pela aplicação.
- Preservação de funcionários, contratos, custos, alíquotas, tabelas e projeções durante a importação.
- Atualização do Fator R ao adicionar ou editar funcionários.
- Identificação da origem da receita nos cards e relatórios.
- Ampliação da regressão para 12 testes.
- Inclusão de validação real no navegador.

### Adicionado

#### Projeção financeira

- Inclusão de cronograma financeiro configurável de receita.
- Cálculo do setup no mês de entrada do cliente.
- Cálculo da mensalidade a partir do mês seguinte ao mês de entrada.
- Configuração de setup, mensalidade, novos clientes e mês de referência.
- Preservação do histórico manual.
- Exportação da projeção nos formatos CSV e HTML.
- Inclusão de testes para o cronograma do Ano 1.
- Inclusão de testes para os totais projetados.

#### Documentação e manutenção

- Inclusão de guia ativo de contribuição e manutenção em `docs/`.
- Inclusão de documentação sobre a fonte única de cálculos.
- Atualização do `README`.
- Inclusão de registro sobre a ausência de histórico Git no pacote recebido.

### Refatorado

#### Estrutura do projeto

- Remoção do simulador duplicado.
- Organização dos materiais históricos no diretório `legacy/`.
- Manutenção do `index.html` apenas como redirecionamento para `src/`.
- Remoção do `simulador.html`.
- Eliminação da entrada paralela de cálculos.
- Manutenção da interface modular como única implementação ativa.
- Remoção de diretórios vazios.
- Confirmação do `index.html` como redirecionamento sem segunda implementação.

### Manutenção

- Inclusão de `.gitignore` para dependências, segredos, caches e pacotes locais.
