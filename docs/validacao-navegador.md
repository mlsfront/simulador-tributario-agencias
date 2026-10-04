# Validação no navegador

Data da verificação: 13 de agosto de 2026.

A página modular em `src/` foi carregada por servidor HTTP local. Os cards exibiram o custo CT de R$ 2.575,00 para uma base contratual de R$ 2.500,00 e ISS de 3%, demonstrando a inclusão única de R$ 75,00 em tributos CT. Para o conjunto de dados inicial, o total de despesas exibido foi R$ 19.962,60, equivalente a DAS de R$ 1.080,00 mais custo de operação de R$ 18.632,60 e custos variáveis de R$ 250,00.

A carga tributária foi apresentada separadamente como R$ 4.242,60 e acompanhada de texto explicativo de que se trata de visão analítica, sem nova soma no total de despesas. Os gráficos foram renderizados e atualizados a partir dos mesmos resultados calculados. Não houve mensagens registradas no console do navegador.

Após a última atualização, a tela confirmou a faixa aberta do IRPF como “Acima da faixa anterior”, sem gerar entrada de R$ 0,00. Também confirmou a remoção do campo editável de CPP patronal no escopo dos Anexos III e V e a atualização dos textos de apoio. Os cards mantiveram a composição: CT de R$ 2.575,00, carga tributária de R$ 4.242,60 e despesas de R$ 19.962,60.

A rota pública da raiz (`/`) foi conferida e redireciona corretamente para `/src/`, consolidando a distribuição na implementação modular corrigida. A tela resultante exibiu o rótulo atualizado de INSS do sócio/contribuinte individual e os valores consolidados sem erros aparentes.

Após a reorganização da raiz, a URL `/` foi testada novamente com servidor HTTP local e redirecionou para `/src/` com sucesso. A remoção de `simulador.html` não afetou o carregamento da aplicação modular nem os cards exibidos.

Na validação da versão 4.2.0, o cronograma exibiu os valores esperados: R$ 9.150,00 no mês 1, R$ 10.338,85 no mês 2, R$ 22.227,35 no mês 12 e total anual de R$ 188.264,10. A interface também exibiu os controles Salvar agora, Carregar salvo, Limpar salvo e o status do autosalvamento. A tabela projetada foi renderizada com todas as colunas e linhas no conteúdo extraído da página.

A sessão de validação aceitou a abertura programática do modal de Configurações Globais. O retorno textual do console não expôs o objeto de inspeção, portanto a confirmação final dos campos do modal será feita pelo estado renderizado e pelos testes da aplicação.

Foi executado um teste controlado no modal com setup de R$ 2.000,00, mensalidade de R$ 300,00, dois novos clientes por mês, mês de referência 3 e autosalvamento desativado. O formulário foi submetido pelo fluxo normal de salvar configurações; a confirmação dos valores exibidos será feita na próxima leitura da página.

O modo avançado foi ativado na interface para validar as tabelas dos Anexos III e V após a criação do grid dedicado e das larguras mínimas. A ação foi aceita pelo controle da página e não gerou erro de execução no fluxo testado.

Com o modo avançado ativo, os cabeçalhos e os valores das tabelas Anexo III e Anexo V foram extraídos integralmente, incluindo faixas, alíquotas e parcelas a deduzir. O console não apresentou erros de aplicação; apenas registrou as ações controladas de validação executadas durante a inspeção.

Na validação da correção do Fator R, a aplicação carregou um snapshot antigo e exibiu os funcionários, mas todos os cards de custos ficaram em zero. O console registrou `TypeError: Cannot read properties of undefined (reading 'rbt12')` em `main.js`, porque um resultado antigo em cache não possuía `revenueBase`. Foi aplicado um fallback para resolver a base pelo `State` quando o campo não existir, preservando compatibilidade durante a atualização de módulos.

Após recarregar com cache busting, a primeira falha foi parcialmente corrigida, mas o console encontrou um segundo acesso direto a `results.revenueBase.origem` na atualização do indicador visual. O fallback havia sido aplicado somente na seção de RBT12; o restante do ciclo ainda dependia do campo novo. A correção deve reutilizar a variável `revenueBase` já resolvida em todo o ciclo de `calcAll()`.

Após o cache busting da versão 4.2.2, a aplicação inicializou sem saída no console. Os cards voltaram a apresentar valores, a folha dos funcionários foi calculada em R$ 13.057,60 e o Fator R exibiu 89,21% com a indicação de base manual do snapshot legado. A projeção ativa continua exibida separadamente e a interface não apresentou erro de inicialização.

No fluxo real do navegador, foi adicionado um terceiro funcionário e informado salário de R$ 2.800,00. A aplicação passou a exibir 3 funcionários, folha anual de R$ 236.586,24, Fator R de 109,53% e custo individual de R$ 3.657,92, confirmando que a edição atualiza folha, Fator R e indicadores sem apagar os registros existentes.

Foi importado no navegador um fixture JSON no mesmo formato do exportador (`timestamp`, `results`, `state`). O estado restaurou corretamente o funcionário, o contrato CT, o custo variável, a receita manual de R$ 12.000,00 e o RBT12 de R$ 144.000,00. A folha exibida foi R$ 45.695,04 e o custo do funcionário importado foi R$ 3.807,92. Não houve erro novo no console durante a importação.


## Validação da versão 4.2.1

A versão 4.2.1 foi validada com cache busting para impedir a reutilização de módulos antigos. O carregamento inicial concluiu sem erros no console, os cards foram preenchidos, a origem da base do Fator R foi exibida e a folha dos funcionários foi calculada.

O fluxo real de inclusão de funcionário foi exercitado no navegador: um terceiro funcionário com salário de R$ 2.800,00 elevou a folha anual para R$ 236.586,24 e o Fator R para 109,53%, sem apagar os dois funcionários existentes.

Também foi importado um JSON no envelope produzido pelo exportador, contendo funcionário, contrato CT, custo variável, histórico manual e configurações. A tela restaurou o funcionário importado, a receita de R$ 12.000,00, o RBT12 de R$ 144.000,00, a folha anual de R$ 45.695,04 e o custo individual de R$ 3.807,92. O console não apresentou erros durante a importação.
