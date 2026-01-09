# 💼 Simulador Tributário para Agências Web

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)

> **Calculadora tributária completa e personalizável para agências web brasileiras enquadradas no Simples Nacional (CNAE 6201-5/02)**

## 📋 Sobre o Projeto

O **Simulador Tributário para Agências Web** é uma ferramenta desenvolvida para resolver um dos maiores desafios de agências digitais brasileiras: **precificação precisa e planejamento tributário eficiente**.

### 🎯 Problema que Resolve

Agências web enfrentam dificuldades para:
- Calcular corretamente impostos sob o regime Simples Nacional
- Entender a migração automática entre Anexo III e Anexo V baseada no Fator R
- Precificar serviços considerando todos os custos (impostos, folha, encargos, variáveis)
- Simular cenários com diferentes configurações de equipe e custos
- Manter controle sobre a carga tributária efetiva

Este simulador oferece uma solução **100% personalizável**, permitindo que você ajuste alíquotas, tabelas progressivas e percentuais conforme a legislação vigente e suas necessidades específicas.

---

## ✨ Funcionalidades

### 🧮 Cálculo Tributário Inteligente

- **Fator R Automático**: Calcula automaticamente o Fator R (massa salarial ÷ receita bruta) e determina o anexo aplicável (III ou V)
- **Migração Automática III ↔ V**: Transição automática entre anexos baseada no limiar configurável do Fator R
- **Dois Modos de Cálculo**:
  - **Modo Básico**: Alíquotas fixas mensais para cálculo rápido
  - **Modo Avançado**: Tabela progressiva completa com alíquota efetiva calculada automaticamente

### 💰 Gestão Completa de Custos

- **Pro-labore do Sócio**: 
  - Cálculo de INSS (até o teto configurável)
  - IRPF progressivo com tabela editável
  - CPP (Contribuição Patronal Previdenciária) aplicada apenas no Anexo V
  
- **Funcionários CLT**:
  - Adicionar múltiplos funcionários
  - Encargos configuráveis: FGTS, Multa FGTS, 13º, Férias, INSS Patronal, RAT
  - Provisões mensais automáticas
  - Benefícios adicionais por funcionário

- **Prestadores CT (PJ/Autônomos)**:
  - Contratos de prestação de serviços
  - ISS e retenções configuráveis
  - Não computam na massa salarial (conforme legislação)

- **Custos Variáveis**:
  - Plugins, licenças, ferramentas SaaS
  - Percentual automático sobre receita

### 📊 Indicadores e Consolidação

- **Carga Tributária Total**: DAS + INSS + IRPF + Encargos
- **Custo de Operação**: Pessoas (sócios + CLT + CT)
- **Total de Despesas**: Visão consolidada com valores absolutos e percentuais
- **Histórico de 12 Meses**: Edição manual das receitas mensais para cálculo preciso do RBT12

### 🎨 Interface e Usabilidade

- **Design Moderno**: Interface dark mode com gradientes e micro-animações
- **Máscaras Brasileiras**: Formatação automática de moeda (R$) e percentuais
- **Edição em Tempo Real**: Todos os campos atualizam cálculos instantaneamente
- **Responsivo**: Funciona perfeitamente em desktop, tablet e mobile

### 💾 Persistência e Exportação

- **LocalStorage**: Salva automaticamente seu estado (debounced)
- **Exportar JSON**: Baixe seus dados para backup
- **Importar JSON**: Restaure configurações salvas
- **Desfazer**: Sistema de histórico com até 20 estados anteriores
- **Configurações Globais**: Modal centralizado para editar todas as alíquotas de uma vez

---

## 🚀 Como Usar

### Instalação

1. **Clone o repositório**:
   ```bash
   git clone https://github.com/mlsfront/simulador-tributario-agencias.git
   cd simulador-tributario-agencias
   ```

2. **Abra o arquivo**:
   ```bash
   # Basta abrir o arquivo HTML em qualquer navegador moderno
   open simulador.html
   # ou
   firefox simulador.html
   # ou
   google-chrome simulador.html
   ```

   **Não requer servidor web, Node.js ou dependências externas!**

### Uso Básico

1. **Configure sua receita mensal** no campo "Receita mensal (Mês Atual)"
2. **Ajuste o histórico de 12 meses** clicando em "Ver/Editar Histórico de 12 Meses"
3. **Configure o pro-labore** do sócio e os encargos aplicáveis
4. **Adicione funcionários CLT** com salários e benefícios
5. **Adicione contratos CT** (prestadores PJ)
6. **Adicione custos variáveis** (ferramentas, licenças)
7. **Visualize a consolidação** na seção "Consolidação e carga tributária"

### Configurações Avançadas

- **Modo Avançado Simples Nacional**: Ative para usar tabelas progressivas completas (Anexos III e V)
- **Configurações Globais**: Clique em "⚙️ Configurações Globais" para editar todas as alíquotas centralizadamente
- **Tabela IRPF**: Configure as faixas de Imposto de Renda Pessoa Física
- **Exportar/Importar**: Faça backup dos seus dados em JSON

---

## 🏛️ Entendendo o CNAE 6201-5/02 e o Fator R

### O que é CNAE 6201-5/02?

**CNAE 6201-5/02** refere-se a "Desenvolvimento de programas de computador sob encomenda" e é a classificação fiscal mais comum para agências web que desenvolvem sites, sistemas e aplicações customizadas.

### Anexo III vs Anexo V

Empresas neste CNAE podem ser tributadas por dois anexos diferentes do Simples Nacional:

| Anexo | Alíquota Inicial | Quando se Aplica |
|-------|------------------|------------------|
| **Anexo III** | 6% | Fator R ≥ 28% (maior massa salarial) |
| **Anexo V** | 15,5% | Fator R < 28% (menor massa salarial) |

### Fator R: A Chave da Tributação

O **Fator R** é calculado pela fórmula:

```
Fator R = (Massa Salarial 12 meses) ÷ (Receita Bruta Total 12 meses)
```

**Massa Salarial inclui**:
- Salários brutos (CLT)
- Pró-labore dos sócios
- 13º salário, férias, FGTS
- INSS Patronal (CPP) sobre folha
- **NÃO inclui**: Contratos CT (PJ), INSS retido do sócio (11%), IRPF

### Por que a Flexibilidade é Importante?

Este simulador permite **editar todas as alíquotas e tabelas** porque:

1. **Legislação muda**: Alíquotas do Simples Nacional são atualizadas periodicamente
2. **Teto INSS varia**: O teto da previdência é reajustado anualmente
3. **Tabela IRPF muda**: Faixas de imposto de renda são corrigidas
4. **Regimes especiais**: Algumas empresas têm CPP diferenciado (ex: Desoneração da folha)
5. **Municípios diferentes**: ISS varia conforme a cidade

---

## 📸 Screenshots / Demo

> **[Adicione aqui capturas de tela do simulador]**

_Placeholder para screenshots:_
- Tela principal com cálculos
- Modo avançado com tabelas progressivas
- Modal de configurações globais
- Seção de indicadores consolidados

---

## 🛠️ Tecnologias Utilizadas

- **HTML5**: Estrutura semântica
- **CSS3**: Design moderno com variáveis CSS, gradientes e animações
- **JavaScript Vanilla**: Lógica de cálculo, máscaras e persistência (sem frameworks)
- **LocalStorage API**: Persistência de dados no navegador
- **Intl.NumberFormat**: Formatação de moeda e percentuais conforme padrão brasileiro

---

## 📦 Estrutura do Projeto

```
simulador-tributario-agencias/
│
├── simulador.html          # Arquivo único standalone (HTML + CSS + JS)
├── README.md               # Este arquivo
├── LICENSE                 # Licença MIT
├── CONTRIBUTING.md         # Guia de contribuição
└── ROADMAP.md             # Melhorias futuras planejadas
```

---

## 🤝 Contribuindo

Contribuições são muito bem-vindas! Veja o arquivo [CONTRIBUTING.md](CONTRIBUTING.md) para detalhes sobre como contribuir.

---

## 📄 Licença

Este projeto está licenciado sob a **Licença MIT** - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

## 👨‍💻 Autor

**MLSFront**

---

## ⭐ Agradecimentos

- Comunidade de desenvolvedores brasileiros
- Contadores e especialistas tributários que vão ajudar a validar os cálculos
- Agências web que vão testar e fornecer feedback

---

## 📞 Suporte

Se você encontrou um bug ou tem uma sugestão, por favor:
1. Verifique se já não existe uma [issue aberta](https://github.com/mlsfront/simulador-tributario-agencias/issues)
2. Crie uma nova issue com detalhes claros
3. Ou envie um Pull Request com a correção!

---

**⚠️ Aviso Legal**: Este simulador é uma ferramenta de apoio à gestão. Sempre consulte um contador para validar cálculos tributários e tomar decisões fiscais.
