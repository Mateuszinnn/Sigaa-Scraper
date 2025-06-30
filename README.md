# 📄 Gerador de Cronograma por Sala – SIGAA Web Scraper (com Interface Web)

Este projeto acessa automaticamente o site do **SIGAA/UnB**, coleta os dados das **turmas, horários e salas de aula**, e gera um documento Word com o **cronograma de aulas por sala**.

Você pode rodar esse sistema tanto pelo terminal (modo tradicional), quanto pela **interface web (mais amigável)** incluída no projeto.

---

## ✅ Pré-requisitos

Você precisará de **duas coisas instaladas** na sua máquina:

### 🐍 1. Python 3.8 ou superior

Verifique se já tem:

```bash
python --version
```

Se não tiver, baixe aqui: [https://www.python.org/downloads/](https://www.python.org/downloads/)

---

### 🧭 2. Node.js (com npm)

Este projeto usa o **Next.js**, que precisa do Node.js para funcionar.

Verifique se já tem:

```bash
node -v
npm -v
```

Se não tiver, baixe aqui: [https://nodejs.org/](https://nodejs.org/)

---

## 🛠️ Instalação dos pacotes

### 1. Instalar pacotes do Python

Abra o terminal na pasta `app\scripts` e execute:

```bash
pip install -r requirements.txt
```

Isso instalará dependências como `selenium`, `python-docx`, `webdriver-manager` etc.

---

### 2. Instalar pacotes do Frontend (Next.js)

Ainda na pasta raiz do projeto, instale as dependências do frontend com:

```bash
npm install
```

---

## 🚀 Como executar a aplicação completa

### Passo 1: Iniciar o servidor da Interface Web (Next.js) produção ou desenvolvimento

Para executar em ambiente de desenvolvimento digite no terminal:

```bash
npm run dev
```

Para executar em ambiente de produção digite no terminal:

```bash
npm run build
npm run start
```

Isso iniciará a **interface gráfica**. Por padrão, ela ficará acessível em:

```
http://localhost:3000
```

---

### Passo 2: Usar a Interface Web

Abra o navegador e vá para `http://localhost:3000`.
Na tela inicial, você verá um botão para iniciar o scraping.

Quando você clicar para iniciar:

* A interface faz uma chamada para a API interna (`/api/executar`);
* O script Python será executado em segundo plano;
* Ao final, o arquivo `Mapa_de_Salas.docx` será gerado automaticamente e ficará disponível para download.

---

## 📁 Saída esperada

Um arquivo será criado:

```
Mapa_de_Salas.docx
```

Este arquivo mostra todas as aulas organizadas por **sala**, separadas por **dia da semana** e **horário**.

---

## ⚙️ Funcionamento interno (resumo técnico)

* O **frontend** foi feito com **Next.js (React)**.
* O botão "Gerar Cronograma" chama uma API interna (`/api/executar`), que executa o script `sigaa-scrapper.py` com `child_process`.
* O **script Python** abre o Chrome, acessa o SIGAA, extrai os dados e gera o documento.
* É possível ver o andamento do processo na tela de logs.
* Quando o script terminar sua execução o docx ficará disponível para download.

---

## ➕ Como incluir mais departamentos

Você pode modificar a variável `departamentos` no Python para buscar mais turmas:

```python
departamentos = [
    "INSTITUTO DE FÍSICA - BRASÍLIA",
    "DEPARTAMENTO DE MATEMÁTICA - BRASÍLIA",
    # ... outros departamentos
]
```

---

## 📏 Regras de Validação

* Apenas **salas que começam com “FCTE ou FGA”** são incluídas.
* Os nomes das salas devem estar **padronizados corretamente**.

---

## 🧪 Modo alternativo: rodar sem o frontend

Se preferir rodar apenas o script pelo terminal:

```bash
python sigaa-scrapper.py
```
