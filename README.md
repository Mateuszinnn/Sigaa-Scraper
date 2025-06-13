# 📄 Documentação do Gerador de Cronograma por Sala (SIGAA Web Scraper)

Este software realiza **web scraping da página de turmas do SIGAA/UnB**, coleta os dados de disciplinas, horários e salas de aula, e **gera automaticamente um documento Word (`Mapa_de_Salas.docx`)** com o cronograma de aulas organizado por sala.

---

## ✅ Pré-requisitos

Certifique-se de ter o **Python 3.8+** instalado em sua máquina.

Além disso, você deve instalar os pacotes listados no arquivo `requirements.txt` antes de executar o script.

---

## 🛠️ Instalação dos pacotes

Abra o terminal no diretório onde está localizado o projeto e execute:

```bash
pip install -r requirements.txt
```

Isso instalará automaticamente as dependências necessárias, como:

* `selenium`
* `python-docx`
* `pillow`
* `webdriver-manager`
  *(ou outros, conforme seu **`requirements.txt`**)*

---

## 🚀 Como executar

### No **Windows**

Abra o terminal (Prompt de Comando ou PowerShell) e digite:

```bash
python .\webscrp.py
```

### No **Linux / macOS**

Abra o terminal e digite:

```bash
python ./webscrp.py
```

---

## 📁 Saída

Ao final da execução, será gerado o arquivo:

```
Mapa_de_Salas.docx
```

Esse documento contém o cronograma de aulas por sala, organizado por dia da semana e horário.

---

## ❗ Observações

* O script utiliza **navegação automatizada com Selenium**, portanto será aberta uma janela do navegador durante a execução.
* É necessário ter o **Google Chrome** instalado, pois o Selenium será configurado automaticamente com `webdriver-manager`.

---

## ➕ Adicionando outros departamentos

Se desejar incluir ou retirar outras turmas de departamentos da universidade além do padrão, você pode modificar a lista `extras` no código-fonte.

Exemplo:

```python
extras = [
    "INSTITUTO DE FÍSICA - BRASÍLIA",
    "INSTITUTO DE QUÍMICA - BRASÍLIA",
    "DEPARTAMENTO DE MATEMÁTICA - BRASÍLIA",
    "DEPARTAMENTO DE ENGENHARIA MECANICA - BRASÍLIA",
    "DEPTO CIÊNCIAS DA COMPUTAÇÃO - BRASÍLIA"
]
```

Adicione o nome exato do departamento como aparece na lista do SIGAA. Isso fará com que essas turmas também sejam consideradas na geração do documento.

---

##Regras: 

Todas as salas devem ter o prefixo FCTE
A quantidade de salas da turma deve ser igual a quantidade de blocos do horario (slot de tempo sem intervalos)



