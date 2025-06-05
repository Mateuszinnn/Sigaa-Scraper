from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select, WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from docx import Document
from docx.shared import Pt, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_ALIGN_VERTICAL
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
from collections import defaultdict
import re, time

# === CONFIGURAÇÃO DO DRIVER ===
def configurar_driver():
    options = Options()
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=options)
    driver.get("https://sigaa.unb.br/sigaa/public/turmas/listar.jsf?aba=p-ensino")
    return driver, WebDriverWait(driver, 10)

# === FECHAR O MODAL DE COOKIES ===
def fechar_modal_cookies():
    try:
        cookie_modal = wait.until(EC.visibility_of_element_located((By.ID, "sigaa-cookie-consent")))
        cookie_modal.find_element(By.XPATH, ".//button[contains(text(), 'Ciente')]").click()
    except:
        pass

# === INTERAÇÕES INICIAIS ===
def selecionar_departamento_por_indice(wait, index):
    Select(wait.until(EC.presence_of_element_located((By.ID, "formTurma:inputNivel")))).select_by_index(2)
    Select(wait.until(EC.presence_of_element_located((By.ID, "formTurma:inputDepto")))).select_by_index(index)
    wait.until(EC.element_to_be_clickable((By.XPATH, "//input[@value='Buscar']"))).click()
    time.sleep(5)

def selecionar_departamento_por_nome(wait, nome):
    Select(wait.until(EC.presence_of_element_located((By.ID, "formTurma:inputNivel")))).select_by_index(2)
    select_depto = Select(wait.until(EC.presence_of_element_located((By.ID, "formTurma:inputDepto"))))
    for option in select_depto.options:
        if nome.lower() in option.text.lower():
            select_depto.select_by_visible_text(option.text)
            break
    wait.until(EC.element_to_be_clickable((By.XPATH, "//input[@value='Buscar']"))).click()
    time.sleep(5)

# === CONVERSÃO DE CÓDIGOS DE HORÁRIO ===
def converter_codigo(codigo):
    dias_semana = {'2': 'Segunda', '3': 'Terça', '4': 'Quarta', '5': 'Quinta', '6': 'Sexta', '7': 'Sábado'}
    match = re.match(r"(\d+)([MTN])(\d+)", codigo)
    if not match:
        return None

    dias, turno, blocos = match.groups()
    horarios = {
        'M': ['08h00\nàs\n09h00','09h00\nàs\n9h50','10h00\nàs\n11h00','11h00\nàs\n11h50','12h00\nàs\n13h50'],
        'T': ['13h00\nàs\n13h50','14h00\nàs\n15h00','15h00\nàs\n15h50','16h00\nàs\n17h00','17h00\nàs\n17h50'],
        'N': ['18h00\nàs\n19h00','19h00\nàs\n19h50','20h00\nàs\n21h00','21h00\nàs\n21h50','22h00\nàs\n23h50']
    }

    dias_lista = [dias_semana[d] for d in dias]
    horarios_lista = [horarios[turno][int(b)-1] for b in blocos if 1 <= int(b) <= 5]
    return dias_lista, ", ".join(horarios_lista)

# === EXTRAÇÃO DE DADOS DA TABELA ===
def extrair_dados(driver, apenas_fcte=False):
    table = driver.find_element(By.CLASS_NAME, "listagem")
    rows = table.find_elements(By.TAG_NAME, "tr")
    cronogramas = defaultdict(lambda: defaultdict(list))
    disciplina = professor = turma = "?"

    for row in rows[1:]:
        try:
            disciplina = row.find_element(By.CLASS_NAME, "tituloDisciplina").text.strip()
            continue
        except:
            pass

        if not any(cl in row.get_attribute("class") for cl in ['linhaPar', 'linhaImpar']):
            continue

        cells = row.find_elements(By.TAG_NAME, "td")
        if len(cells) < 8:
            continue

        raw_sala = cells[7].text.strip().upper()
        if apenas_fcte and not (raw_sala.startswith("FCTE") or raw_sala.startswith("FGA")):
            continue

        turma = cells[0].text.strip()
        professor = re.sub(r'\s*\(\d+h\)', '', cells[2].text.strip())
        horarios = re.findall(r'\d+[MTN]\d+', cells[3].text.strip())

        sem_prefixo = re.sub(r'^(?:FCTE|FGA)\s*-\s*', '', raw_sala)
        clean = re.sub(r'\s*\([^)]*\)', '', sem_prefixo).strip()

        if clean == "NIT/LDS":
            salas = [clean]
        else:
            salas = [s.strip() for s in clean.split('/')]

        idx = 0
        for cod in horarios:
            resultado = converter_codigo(cod)
            if not resultado:
                continue
            dias, horario = resultado
            desc = f"TURMA {turma}\n{disciplina}\n Prof. {professor}"
            for dia in dias:
                nome_sala = f"FCTE - {salas[min(idx, len(salas)-1)]}"
                cronogramas[nome_sala][dia].append(f"{horario} - {desc}")
                idx += 1

    return cronogramas

# === FONTE ===
def set_font_times_new_roman(doc):
    style = doc.styles['Normal']
    font = style.font
    font.name = 'Times New Roman'
    rFonts = style.element.rPr.rFonts
    rFonts.set(qn('w:eastAsia'), 'Times New Roman')

# === MARGEM ===
def definir_margens(doc, cm_valor=1):
    for section in doc.sections:
        section.top_margin = Cm(cm_valor)
        section.bottom_margin = Cm(cm_valor)
        section.left_margin = Cm(cm_valor)
        section.right_margin = Cm(cm_valor)

# === CRIAÇÃO DO DOCUMENTO ===
def gerar_docx(cronogramas, filename='Mapa_de_Salas.docx'):
    doc = Document()
    set_font_times_new_roman(doc)
    definir_margens(doc, 1)

    dias_da_semana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
    horarios_manha_tarde = [
        '08h00\nàs\n09h00','09h00\nàs\n9h50','10h00\nàs\n11h00','11h00\nàs\n11h50','12h00\nàs\n13h50',
        '13h00\nàs\n13h50','14h00\nàs\n15h00','15h00\nàs\n15h50','16h00\nàs\n17h00','17h00\nàs\n17h50'
    ]
    horarios_noite = [
        '18h00\nàs\n19h00','19h00\nàs\n19h50','20h00\nàs\n21h00','21h00\nàs\n21h50','22h00\nàs\n23h50'
    ]

    for sala in sorted(cronogramas.keys()):
        dias = cronogramas[sala]
        doc.add_page_break()
        heading = doc.add_heading(f"Sala: {sala}", level=1)
        heading.alignment = WD_ALIGN_PARAGRAPH.CENTER

        # Verificar se tem sábado
        tem_sabado = 'Sábado' in dias and len(dias['Sábado']) > 0

        # Verificar se tem aulas noturnas
        tem_noite = False
        for dia_aulas in dias.values():
            for entrada in dia_aulas:
                blocos, _ = entrada.split(" - ", 1)
                blocos_lista = blocos.split(', ')
                for bloco in blocos_lista:
                    if bloco in horarios_noite:
                        tem_noite = True
                        break
                if tem_noite:
                    break
            if tem_noite:
                break

        # Criar lista de dias a mostrar (remove sábado se não tiver)
        dias_a_mostrar = dias_da_semana[:-1]  # segunda a sexta
        if tem_sabado:
            dias_a_mostrar.append('Sábado')

        # Criar lista de horários a mostrar (remove noite se não tiver)
        if tem_noite:
            horarios_a_mostrar = horarios_manha_tarde + horarios_noite
        else:
            horarios_a_mostrar = horarios_manha_tarde

        # Criar a tabela com número de linhas e colunas corretos
        table = doc.add_table(rows=len(horarios_a_mostrar)+1, cols=len(dias_a_mostrar)+1)
        table.style = 'Table Grid'
        table.autofit = False

        tbl = table._tbl         
        tblPr = tbl.tblPr        

        if tblPr is None:
            tblPr = OxmlElement('w:tblPr')
            tbl.insert(0, tblPr)

        # 1) fixa o layout em “fixed”
        tblLayout = OxmlElement('w:tblLayout')
        tblLayout.set(qn('w:type'), 'fixed')
        tblPr.append(tblLayout)

        # 2) define a largura total da tabela
        section = doc.sections[0]
        usable_width_emu = section.page_width - section.left_margin - section.right_margin
        usable_width_twips = int(usable_width_emu * 1440 / 914400)

        tblW = OxmlElement('w:tblW')
        tblW.set(qn('w:w'), str(usable_width_twips))
        tblW.set(qn('w:type'), 'dxa')
        tblPr.append(tblW)

        # 3) calcula larguras especiais
        fixed_col_width_emu = Cm(2)  # primeira coluna: 2 cm
        total_cols = len(dias_a_mostrar) + 1
        remaining_width_emu = usable_width_emu - fixed_col_width_emu
        if total_cols > 1:
            other_col_width_emu = remaining_width_emu // (total_cols - 1)
        else:
            other_col_width_emu = remaining_width_emu

        # 4) aplica larguras personalizadas
        for idx, col in enumerate(table.columns):
            w = fixed_col_width_emu if idx == 0 else other_col_width_emu
            for cell in col.cells:
                cell.width = w


        # Cabeçalho da tabela
        table.cell(0, 0).text = 'Horário'
        for c, dia in enumerate(dias_a_mostrar, 1):
            table.cell(0, c).text = dia

        # Coluna de horários
        for r, horario in enumerate(horarios_a_mostrar, 1):
            cell = table.cell(r, 0)
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            para = cell.paragraphs[0]
            para.alignment = WD_ALIGN_PARAGRAPH.CENTER
            run = para.add_run(horario)
            run.bold = True
            run.font.size = Pt(14)

        # Preenchimento da tabela com as aulas
        for dia, entradas in dias.items():
            if dia not in dias_a_mostrar:
                continue
            c = dias_a_mostrar.index(dia) + 1
            for entrada in entradas:
                blocos, desc = entrada.split(" - ", 1)
                for bloco in blocos.split(', '):
                    if bloco not in horarios_a_mostrar:
                        continue
                    r = horarios_a_mostrar.index(bloco) + 1
                    cell = table.cell(r, c)
                    cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
                    para = cell.paragraphs[0]
                    para.clear()
                    para.alignment = WD_ALIGN_PARAGRAPH.CENTER

                    linhas = desc.strip().split('\n')
                    turma_txt = linhas[0].strip()
                    if len(linhas) > 1:
                        if ' - ' in linhas[1]:
                            codigo_mat, nome_mat = linhas[1].split(' - ', 1)
                        else:
                            codigo_mat, nome_mat = linhas[1], ""
                    else:
                        codigo_mat, nome_mat = "", ""

                    prof = linhas[2] if len(linhas) > 2 else ""

                    # Inserção formatada
                    run = para.add_run(codigo_mat + "\n")
                    run.bold = True
                    run.font.size = Pt(14)

                    run = para.add_run(turma_txt + "\n")
                    run.bold = True
                    run.font.size = Pt(13)

                    run = para.add_run(nome_mat.lower().title() + "\n")
                    run.italic = True
                    run.font.size = Pt(12)

                    run = para.add_run(' '.join(p.capitalize() for p in prof.split()))
                    run.font.size = Pt(10)

    doc.save(filename)
    print(f"Documento gerado: {filename}")

# === EXECUÇÃO ===
driver, wait = configurar_driver()
fechar_modal_cookies()

selecionar_departamento_por_indice(wait, 2)
cronogramas_principais = extrair_dados(driver, apenas_fcte=False)

# departamentos extras com filtro FCTE
extras = [
    "INSTITUTO DE FÍSICA - BRASÍLIA",
    "INSTITUTO DE QUÍMICA - BRASÍLIA",
    "DEPARTAMENTO DE MATEMÁTICA - BRASÍLIA",
    "DEPARTAMENTO DE ENGENHARIA MECANICA - BRASÍLIA",
    "DEPTO CIÊNCIAS DA COMPUTAÇÃO - BRASÍLIA"
]

for depto in extras:
    selecionar_departamento_por_nome(wait, depto)
    cronos = extrair_dados(driver, apenas_fcte=True)
    for sala, dias in cronos.items():
        for dia, aulas in dias.items():
            cronogramas_principais[sala][dia].extend(aulas)

gerar_docx(cronogramas_principais)
driver.quit()

#Limitações do programa:
# Má formatação do nome das Salas
# Matérias com 3 salas

#Dúvidas
# Matérias com 2 dias  e 3 salas
# Diferença de códigos no sigaa e material do chiquinho

#Não consta
# Monitorias
# Eventos