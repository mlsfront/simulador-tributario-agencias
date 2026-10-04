# 🤝 Guia de Contribuição

Obrigado por considerar contribuir com o **Simulador Tributário para Agências Web**! Este documento fornece diretrizes para garantir que suas contribuições sejam integradas de forma eficiente.

---

## 📋 Código de Conduta

Ao participar deste projeto, você concorda em manter um ambiente respeitoso e colaborativo. Seja gentil, construtivo e profissional em todas as interações.

---

## 🚀 Como Contribuir

### 1. **Reportar Bugs**

Encontrou um erro? Ajude-nos a corrigi-lo!

**Antes de reportar**:
- Verifique se o bug já não foi reportado nas [issues existentes](https://github.com/mlsfront/simulador-tributario-agencias/issues)
- Teste no navegador mais recente (Chrome, Firefox, Safari)

**Ao criar a issue**:
- Use um título descritivo (ex: "Cálculo de IRPF incorreto para faixa acima de R$ 4.664,68")
- Descreva os passos para reproduzir
- Inclua valores de entrada e saída esperada vs. obtida
- Adicione screenshots se aplicável
- Informe navegador e versão do OS

**Template de Bug Report**:
```markdown
**Descrição**: O cálculo do IRPF está retornando valor negativo

**Passos para Reproduzir**:
1. Configurar pro-labore: R$ 2.000,00
2. Observar campo "IRPF do sócio"

**Resultado Esperado**: R$ 0,00 (isento)
**Resultado Obtido**: R$ -169,44

**Ambiente**:
- Navegador: Chrome 120
- OS: Windows 11
```

---

### 2. **Sugerir Melhorias**

Tem uma ideia para melhorar o simulador?

**Crie uma issue com**:
- Tag `enhancement`
- Descrição clara do problema que resolve
- Proposta de solução (se possível, com exemplos)
- Benefícios para os usuários

**Exemplo**:
```markdown
**Feature**: Exportar relatório em PDF

**Problema**: Usuários precisam apresentar simulações para clientes/contadores

**Solução Proposta**: Botão "Exportar PDF" que gera relatório formatado

**Benefícios**: Profissionalização, facilita compartilhamento
```

---

### 3. **Contribuir com Código**

#### **Workflow Git**

1. **Fork o repositório**
   ```bash
   # Clique em "Fork" no GitHub
   ```

2. **Clone seu fork**
   ```bash
   git clone https://github.com/mlsfront/simulador-tributario-agencias.git
   cd simulador-tributario-agencias
   ```

3. **Crie uma branch para sua feature/fix**
   ```bash
   git checkout -b feature/exportar-pdf
   # ou
   git checkout -b fix/calculo-irpf
   ```

4. **Faça suas alterações**
   - Siga os padrões de código (veja abaixo)
   - Teste manualmente
   - Adicione comentários quando necessário

5. **Commit com mensagens claras**
   ```bash
   git add .
   git commit -m "feat: adiciona exportação de relatório em PDF"
   # ou
   git commit -m "fix: corrige cálculo de IRPF para faixa isenta"
   ```

   **Convenção de Commits** (seguir [Conventional Commits](https://www.conventionalcommits.org/)):
   - `feat:` nova funcionalidade
   - `fix:` correção de bug
   - `docs:` alterações em documentação
   - `style:` formatação, ponto e vírgula, etc (sem mudança de lógica)
   - `refactor:` refatoração de código
   - `test:` adição de testes
   - `chore:` tarefas de build, dependências, etc

6. **Push para seu fork**
   ```bash
   git push origin feature/exportar-pdf
   ```

7. **Abra um Pull Request**
   - Vá para o repositório original no GitHub
   - Clique em "New Pull Request"
   - Descreva suas mudanças claramente
   - Referencie issues relacionadas (ex: "Closes #42")

---

## 📐 Padrões de Código

### **JavaScript**

- **Indentação**: 2 espaços
- **Ponto e vírgula**: Obrigatório
- **Aspas**: Simples (`'string'`)
- **Nomenclatura**:
  - Variáveis/funções: `camelCase`
  - Constantes: `UPPER_SNAKE_CASE`
  - Classes: `PascalCase`

**Exemplo**:
```javascript
// ✅ BOM
const calcularFatorR = (massaSalarial, receitaBruta) => {
  const fatorR = receitaBruta > 0 ? (massaSalarial / receitaBruta) : 0;
  return fatorR;
};

// ❌ RUIM
function calcular_fator_r(massa_salarial,receita_bruta){
  return massa_salarial/receita_bruta
}
```

### **CSS**

- **Nomenclatura**: BEM ou classes descritivas
- **Variáveis CSS**: Usar `--variavel-nome` para cores, espaçamentos
- **Mobile-first**: Media queries de menor para maior

**Exemplo**:
```css
/* ✅ BOM */
.card {
  background: var(--card);
  border-radius: 12px;
}

.card__title {
  font-size: 18px;
}

/* ❌ RUIM */
.c {
  background: #141a21;
}
```

### **HTML**

- **Semântico**: Usar tags apropriadas (`<section>`, `<article>`, `<nav>`)
- **Acessibilidade**: Incluir `aria-label`, `alt` em imagens
- **Indentação**: 2 espaços

---

## 🧪 Testes

Atualmente, o projeto não possui testes automatizados (veja [ROADMAP.md](ROADMAP.md#3-testes-automatizados)).

**Ao contribuir**:
- Teste manualmente todas as funcionalidades afetadas
- Verifique em diferentes navegadores (Chrome, Firefox, Safari)
- Teste em mobile (responsividade)

**Checklist de Testes Manuais**:
- [ ] Cálculos corretos (DAS, IRPF, Fator R)
- [ ] Máscaras funcionando (R$, %)
- [ ] LocalStorage salvando/carregando
- [ ] Exportar/Importar JSON
- [ ] Responsividade (mobile, tablet, desktop)
- [ ] Sem erros no console

---

## 📚 Documentação

Ao adicionar novas funcionalidades:
1. **Atualize o README.md** (seção de funcionalidades)
2. **Adicione comentários no código** para lógica complexa
3. **Atualize o ROADMAP.md** se aplicável

**Exemplo de Comentário**:
```javascript
/**
 * Calcula o Fator R conforme Lei Complementar 123/2006
 * @param {number} massaSalarial - Soma de 12 meses (pró-labore + CLT + encargos)
 * @param {number} receitaBruta - RBT12 (Receita Bruta Total 12 meses)
 * @returns {number} Fator R (0 a 1)
 */
const calcularFatorR = (massaSalarial, receitaBruta) => {
  // ...
};
```

---

## 🎨 Design e UX

Ao propor mudanças visuais:
- Mantenha a identidade dark mode
- Use as variáveis CSS existentes (`--accent`, `--bg`, etc)
- Priorize acessibilidade (contraste, tamanho de fonte)
- Teste em diferentes resoluções

---

## 🔍 Revisão de Código

Todos os Pull Requests passarão por revisão. Esperamos:
- Código limpo e legível
- Sem funcionalidades quebradas
- Commits atômicos (uma mudança por commit)
- Descrição clara do PR

**Tempo de Resposta**: Tentaremos revisar em até 7 dias úteis.

---

## 🏆 Reconhecimento

Contribuidores serão listados no README.md na seção de agradecimentos!

---

## 📞 Dúvidas?

- Abra uma [issue](https://github.com/mlsfront/simulador-tributario-agencias/issues) com a tag `question`

---

**Obrigado por contribuir! Juntos, tornamos este simulador cada vez melhor.** 🚀
