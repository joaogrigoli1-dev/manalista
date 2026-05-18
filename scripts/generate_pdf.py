#!/usr/bin/env python3
"""MAnalista — Gerador de Laudo Final PDF (Light Theme, Print-Friendly)

Versão 2.0 — 2026-05-17
- Paleta light WCAG AAA otimizada para impressão (P&B e colorida)
- 11 seções incluindo Resumo do Paciente, Queixas, Desenvolvimento, Histórico
- Síntese do debate multiprofissional
- Cards com fundos suaves (-50) que não gastam toner
"""
import sys, json, re
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether, PageBreak, ListFlowable, ListItem
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY

W, H = A4

# ══════════════════════════════════════════════════════════════════════════
#  PALETA LIGHT — Print-Friendly · WCAG AAA
# ══════════════════════════════════════════════════════════════════════════
C_BG       = colors.HexColor("#FFFFFF")   # Fundo principal — branco puro
C_BG_SOFT  = colors.HexColor("#F8FAFC")   # slate-50 · cards/seções
C_BG_TINT  = colors.HexColor("#F1F5F9")   # slate-100 · zebras de tabela
C_INK      = colors.HexColor("#0F172A")   # slate-900 · headings
C_TEXT     = colors.HexColor("#334155")   # slate-700 · texto corrido
C_MUTED    = colors.HexColor("#64748B")   # slate-500 · labels
C_BORDER   = colors.HexColor("#E2E8F0")   # slate-200 · bordas finas
C_BORDER_M = colors.HexColor("#CBD5E1")   # slate-300 · bordas médias

# Accents — versões -700 (alta legibilidade impressa)
C_PURPLE   = colors.HexColor("#6D28D9")   # violet-700
C_BLUE     = colors.HexColor("#1D4ED8")   # blue-700
C_GREEN    = colors.HexColor("#047857")   # emerald-700
C_AMBER    = colors.HexColor("#B45309")   # amber-700
C_CORAL    = colors.HexColor("#B91C1C")   # red-700

# Backgrounds suaves para cards de patologia (-50, ~5% saturação)
C_PURPLE_BG = colors.HexColor("#F5F3FF")
C_BLUE_BG   = colors.HexColor("#EFF6FF")
C_GREEN_BG  = colors.HexColor("#ECFDF5")
C_AMBER_BG  = colors.HexColor("#FFFBEB")
C_CORAL_BG  = colors.HexColor("#FEF2F2")

SPECIALIST_MAP = {
    "psi-infantil":          ("Psicólogo(a) Infantil",            "Avaliação e terapia psicológica para crianças"),
    "psi-parentalidade":     ("Psicólogo(a) — Orientação Familiar", "Suporte parental e estratégias de parentalidade"),
    "neuropsico":            ("Neuropsicólogo(a)",                 "Avaliação neuropsicológica e cognitiva"),
    "neuropediatra":         ("Neuropediatra",                     "Avaliação neurológica pediátrica"),
    "bcba":                  ("Analista do Comportamento (BCBA)",  "Intervenção baseada em ABA/comportamento"),
    "fonoaudiologia":        ("Fonoaudiólogo(a)",                  "Avaliação e terapia de linguagem e comunicação"),
    "terapeuta-ocupacional": ("Terapeuta Ocupacional",             "Integração sensorial e habilidades adaptativas"),
    "psiquiatra-infantil":   ("Psiquiatra Infantil",               "Avaliação psiquiátrica e manejo medicamentoso"),
}

AGENT_NAMES = {
    "psi-infantil":          "Dra. Sofia Vygotski",
    "psi-parentalidade":     "Dr. Victor Winnicott",
    "neuropediatra":         "Dr. Marco Cajal",
    "bcba":                  "Dra. Íris Skinner",
    "fonoaudiologia":        "Dra. Camila Saussure",
    "terapeuta-ocupacional": "Dra. Elena Slagle",
    "psiquiatra-infantil":   "Dr. Rafael Kanner",
    "mediator":              "Coord. Atlas",
}

CONF_LABELS = {"alta": "Alta", "moderada": "Moderada", "baixa": "Baixa"}
CONF_COLORS = {"alta": C_GREEN, "moderada": C_AMBER, "baixa": C_CORAL}
CONF_PCT    = {"alta": 90, "moderada": 65, "baixa": 35}
EV_COLORS   = {"A": C_GREEN, "B": C_AMBER, "C": C_CORAL}
EV_LABELS   = {"A": "Evidência A — Forte", "B": "Evidência B — Moderada", "C": "Evidência C — Preliminar"}

# ── Helpers de texto ──────────────────────────────────────────────────────
def esc(t):
    return str(t).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

CLINICAL_SEPARATOR = "---DADOS-CLINICOS---"
def strip_technical_json(text):
    """Remove tudo após o separador ---DADOS-CLINICOS--- usado no streaming."""
    idx = text.find(CLINICAL_SEPARATOR)
    return text[:idx].strip() if idx >= 0 else text.strip()

def md_para(text, style):
    t = esc(strip_technical_json(text))
    t = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', t)
    t = re.sub(r'\*(.+?)\*',     r'<i>\1</i>', t)
    t = re.sub(r'`(.+?)`', r'<font name="Courier">\1</font>', t)
    return Paragraph(t, style)

def split_bullets(text):
    """Quebra um texto em bullets (• ou linhas separadas) e retorna lista limpa."""
    if not text:
        return []
    # Tenta primeiro padrão "• item" em linhas separadas
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    bullets = []
    for ln in lines:
        ln = re.sub(r'^[•\-\*]\s*', '', ln)
        if ln:
            bullets.append(ln)
    return bullets

# ══════════════════════════════════════════════════════════════════════════
#  ESTILOS
# ══════════════════════════════════════════════════════════════════════════
def make_styles():
    return {
        # ── Capa ──
        "cover_title": ParagraphStyle("cover_title",
            fontName="Helvetica-Bold", fontSize=42, textColor=C_INK,
            leading=48, alignment=TA_CENTER, spaceAfter=4),
        "cover_sub": ParagraphStyle("cover_sub",
            fontName="Helvetica", fontSize=13, textColor=C_TEXT,
            leading=18, alignment=TA_CENTER, spaceAfter=4),
        "cover_meta_label": ParagraphStyle("cover_meta_label",
            fontName="Helvetica-Bold", fontSize=8, textColor=C_MUTED,
            alignment=TA_CENTER, spaceAfter=3, leading=10,
            textTransform="uppercase", charSpace=1.5),
        "cover_meta_value": ParagraphStyle("cover_meta_value",
            fontName="Helvetica-Bold", fontSize=14, textColor=C_INK,
            alignment=TA_CENTER, spaceAfter=2, leading=18),
        "cover_meta_sub": ParagraphStyle("cover_meta_sub",
            fontName="Helvetica", fontSize=10, textColor=C_TEXT,
            alignment=TA_CENTER, leading=14),

        # ── Section headers ──
        "section_num": ParagraphStyle("section_num",
            fontName="Helvetica-Bold", fontSize=14, textColor=C_PURPLE,
            leading=18, spaceAfter=0),
        "section_title": ParagraphStyle("section_title",
            fontName="Helvetica-Bold", fontSize=14, textColor=C_INK,
            leading=18, spaceAfter=2),
        "section_kicker": ParagraphStyle("section_kicker",
            fontName="Helvetica", fontSize=9, textColor=C_MUTED,
            leading=12, spaceAfter=8),

        # ── Conteúdo ──
        "h3": ParagraphStyle("h3",
            fontName="Helvetica-Bold", fontSize=10.5, textColor=C_INK,
            leading=14, spaceAfter=3, spaceBefore=6),
        "h4": ParagraphStyle("h4",
            fontName="Helvetica-Bold", fontSize=9, textColor=C_TEXT,
            leading=12, spaceAfter=2, spaceBefore=4,
            textTransform="uppercase", charSpace=0.8),
        "body": ParagraphStyle("body",
            fontName="Helvetica", fontSize=9.5, textColor=C_TEXT,
            leading=14, spaceAfter=3, alignment=TA_JUSTIFY),
        "body_bold": ParagraphStyle("body_bold",
            fontName="Helvetica-Bold", fontSize=9.5, textColor=C_INK,
            leading=14, spaceAfter=2),
        "bullet": ParagraphStyle("bullet",
            fontName="Helvetica", fontSize=9.5, textColor=C_TEXT,
            leading=14, leftIndent=14, spaceAfter=2, bulletIndent=4),
        "label": ParagraphStyle("label",
            fontName="Helvetica-Bold", fontSize=7.5, textColor=C_MUTED,
            leading=10, spaceAfter=3, spaceBefore=6,
            textTransform="uppercase", charSpace=1.2),
        "label_value": ParagraphStyle("label_value",
            fontName="Helvetica", fontSize=10, textColor=C_INK,
            leading=14, spaceAfter=4),

        # ── Patologia principal ──
        "path_main": ParagraphStyle("path_main",
            fontName="Helvetica-Bold", fontSize=20, textColor=C_INK,
            leading=24, spaceAfter=4, alignment=TA_CENTER),
        "path_codes": ParagraphStyle("path_codes",
            fontName="Helvetica", fontSize=10, textColor=C_TEXT,
            leading=13, alignment=TA_CENTER),

        # ── KPI ──
        "kpi_value": ParagraphStyle("kpi_value",
            fontName="Helvetica-Bold", fontSize=24, textColor=C_INK,
            leading=28, alignment=TA_CENTER),
        "kpi_label": ParagraphStyle("kpi_label",
            fontName="Helvetica", fontSize=8, textColor=C_MUTED,
            leading=11, alignment=TA_CENTER, spaceAfter=2),

        # ── Especialistas ──
        "spec_name": ParagraphStyle("spec_name",
            fontName="Helvetica-Bold", fontSize=11, textColor=C_INK,
            leading=14, spaceAfter=1),
        "spec_desc": ParagraphStyle("spec_desc",
            fontName="Helvetica", fontSize=9, textColor=C_TEXT,
            leading=12, spaceAfter=0),

        # ── Debate ──
        "agent_name": ParagraphStyle("agent_name",
            fontName="Helvetica-Bold", fontSize=10, textColor=C_PURPLE,
            leading=13, spaceAfter=2),
        "agent_speech": ParagraphStyle("agent_speech",
            fontName="Helvetica", fontSize=9.5, textColor=C_TEXT,
            leading=14, spaceAfter=6, alignment=TA_JUSTIFY,
            leftIndent=4),

        # ── Referências ──
        "ref": ParagraphStyle("ref",
            fontName="Helvetica", fontSize=8.5, textColor=C_TEXT,
            leading=12, leftIndent=14, spaceAfter=4, firstLineIndent=-14),

        # ── Disclaimer / Footer ──
        "disclaimer": ParagraphStyle("disclaimer",
            fontName="Helvetica-Oblique", fontSize=8.5, textColor=C_CORAL,
            leading=12, alignment=TA_CENTER),
        "disclaimer_body": ParagraphStyle("disclaimer_body",
            fontName="Helvetica", fontSize=8, textColor=C_MUTED,
            leading=11, alignment=TA_JUSTIFY),
        "footer": ParagraphStyle("footer",
            fontName="Helvetica", fontSize=7.5, textColor=C_MUTED,
            alignment=TA_CENTER),

        # ── Badge ──
        "badge": ParagraphStyle("badge",
            fontName="Helvetica-Bold", fontSize=7.5, textColor=C_BG,
            alignment=TA_CENTER, leading=10),
    }

# ══════════════════════════════════════════════════════════════════════════
#  BACKGROUND DE PÁGINA (LIGHT)
# ══════════════════════════════════════════════════════════════════════════
class LightBackground:
    def __init__(self, child_name, date_str):
        self.child_name = child_name
        self.date_str = date_str

    def __call__(self, canv, doc):
        canv.saveState()
        # Fundo branco puro (não desenha nada — page é branca por padrão)

        # Cabeçalho: linha sutil + texto
        canv.setStrokeColor(C_BORDER)
        canv.setLineWidth(0.5)
        canv.line(15*mm, H - 14*mm, W - 15*mm, H - 14*mm)

        canv.setFont("Helvetica-Bold", 8.5)
        canv.setFillColor(C_PURPLE)
        canv.drawString(15*mm, H - 11*mm, "MAnalista")

        canv.setFont("Helvetica", 7.5)
        canv.setFillColor(C_MUTED)
        canv.drawCentredString(W/2, H - 11*mm, f"Laudo Multiprofissional — {self.child_name}")
        canv.drawRightString(W - 15*mm, H - 11*mm, self.date_str)

        # Rodapé
        canv.setStrokeColor(C_BORDER)
        canv.setLineWidth(0.5)
        canv.line(15*mm, 14*mm, W - 15*mm, 14*mm)

        canv.setFont("Helvetica-Oblique", 7)
        canv.setFillColor(C_CORAL)
        canv.drawCentredString(W/2, 9*mm,
            "MODO DEMONSTRAÇÃO — Não constitui diagnóstico real. Consulte profissionais habilitados.")

        canv.setFont("Helvetica", 7.5)
        canv.setFillColor(C_MUTED)
        canv.drawRightString(W - 15*mm, 9*mm, f"Pág. {doc.page}")
        canv.drawString(15*mm, 9*mm, "manalista.com.br")

        canv.restoreState()

# ══════════════════════════════════════════════════════════════════════════
#  HELPERS DE COMPONENTES
# ══════════════════════════════════════════════════════════════════════════
def progress_row(label, pct, bar_color, S, bar_w=130*mm):
    """Barra de progresso horizontal com label + percentual."""
    pct_int = max(0, min(100, int(pct)))
    filled = bar_w * pct_int / 100
    empty  = bar_w - filled
    bar = Table([[
        Paragraph("", ParagraphStyle("x")),
        Paragraph("", ParagraphStyle("x")),
    ]], colWidths=[filled if filled > 0 else 0.1, empty if empty > 0 else 0.1], rowHeights=[6])
    bar.setStyle(TableStyle([
        ("TOPPADDING",    (0,0), (-1,-1), 0),
        ("BOTTOMPADDING", (0,0), (-1,-1), 0),
        ("LEFTPADDING",   (0,0), (-1,-1), 0),
        ("RIGHTPADDING",  (0,0), (-1,-1), 0),
        ("ROWBACKGROUNDS",(0,0), (-1,-1), [bar_color, C_BORDER]),
        ("ROUNDEDCORNERS",[3]),
    ]))
    row_cols = [None, bar_w, 14*mm] if label else [bar_w, 14*mm]
    cells = []
    if label:
        cells.append(Paragraph(esc(label), S["body"]))
    cells.append(bar)
    cells.append(Paragraph(f"<b>{pct_int}%</b>",
        ParagraphStyle("pctv", fontName="Helvetica-Bold", fontSize=10,
                       textColor=bar_color, alignment=TA_RIGHT)))
    row = Table([cells], colWidths=row_cols)
    row.setStyle(TableStyle([
        ("TOPPADDING",    (0,0), (-1,-1), 3),
        ("BOTTOMPADDING", (0,0), (-1,-1), 3),
        ("LEFTPADDING",   (0,0), (-1,-1), 0),
        ("RIGHTPADDING",  (0,0), (-1,-1), 0),
        ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
    ]))
    return row

def section_header(num, title, kicker, accent, S):
    """Header padrão de seção: número + título + kicker + linha colorida."""
    elems = []
    elems.append(Spacer(1, 6*mm))
    # Row com número grande + título
    head_table = Table([[
        Paragraph(f"<b>{num}</b>", S["section_num"]),
        Paragraph(esc(title), S["section_title"]),
    ]], colWidths=[10*mm, None])
    head_table.setStyle(TableStyle([
        ("TOPPADDING",    (0,0), (-1,-1), 0),
        ("BOTTOMPADDING", (0,0), (-1,-1), 0),
        ("LEFTPADDING",   (0,0), (-1,-1), 0),
        ("RIGHTPADDING",  (0,0), (-1,-1), 0),
        ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
    ]))
    elems.append(head_table)
    if kicker:
        elems.append(Paragraph(esc(kicker), S["section_kicker"]))
    elems.append(HRFlowable(width="100%", thickness=1.5, color=accent, spaceAfter=8))
    return elems

def info_card(label, value, S, accent=None):
    """Card horizontal label + valor (para resumos de paciente)."""
    accent = accent or C_PURPLE
    if not value or value == "—" or not str(value).strip():
        value = "Não informado"
        value_style = ParagraphStyle("nv", fontName="Helvetica-Oblique",
            fontSize=9.5, textColor=C_MUTED, leading=13)
    else:
        value_style = S["label_value"]

    card = Table([[
        Paragraph(esc(label.upper()), S["label"]),
        Paragraph(esc(str(value)), value_style),
    ]], colWidths=[42*mm, None])
    card.setStyle(TableStyle([
        ("TOPPADDING",    (0,0), (-1,-1), 6),
        ("BOTTOMPADDING", (0,0), (-1,-1), 6),
        ("LEFTPADDING",   (0,0), (-1,-1), 10),
        ("RIGHTPADDING",  (0,0), (-1,-1), 10),
        ("BACKGROUND",    (0,0), (-1,-1), C_BG_SOFT),
        ("LINEBEFORE",    (0,0), (0,-1), 2.5, accent),
        ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
    ]))
    return card

def bullet_list_card(label, items, S, accent=None):
    """Card com label e lista de bullets."""
    accent = accent or C_PURPLE
    if not items:
        return info_card(label, "Nenhum item informado", S, accent)

    bullet_paras = [Paragraph(f"• {esc(it)}", S["bullet"]) for it in items]
    content = [Paragraph(esc(label.upper()), S["label"])] + bullet_paras

    card = Table([[content]], colWidths=[None])
    card.setStyle(TableStyle([
        ("TOPPADDING",    (0,0), (-1,-1), 8),
        ("BOTTOMPADDING", (0,0), (-1,-1), 8),
        ("LEFTPADDING",   (0,0), (-1,-1), 12),
        ("RIGHTPADDING",  (0,0), (-1,-1), 12),
        ("BACKGROUND",    (0,0), (-1,-1), C_BG_SOFT),
        ("LINEBEFORE",    (0,0), (0,-1), 2.5, accent),
        ("VALIGN",        (0,0), (-1,-1), "TOP"),
    ]))
    return card

# ══════════════════════════════════════════════════════════════════════════
#  CONSTRUTOR PRINCIPAL DA HISTÓRIA
# ══════════════════════════════════════════════════════════════════════════
def build_story(data, styles):
    S = styles
    story = []
    child = data.get("childData", {})
    results = data.get("results", [])
    pathologies = data.get("detectedPathologies", [])
    debate_messages = data.get("debateMessages", [])
    quality_score = data.get("qualityScore", 0)

    child_name = child.get("name", "—")
    age_y = child.get("ageYears", 0)
    age_m = child.get("ageMonths", 0)
    sex_map = {"M": "Masculino", "F": "Feminino", "outro": "Outro"}
    sex = sex_map.get(child.get("sex", "M"), "—")
    birthdate = child.get("birthdate", "")
    # Formata data BR
    try:
        if birthdate:
            bd = datetime.fromisoformat(birthdate)
            birthdate_br = bd.strftime("%d/%m/%Y")
        else:
            birthdate_br = "—"
    except Exception:
        birthdate_br = birthdate or "—"

    # ──────────────────────────────────────────────────────────────────────
    # CAPA
    # ──────────────────────────────────────────────────────────────────────
    story.append(Spacer(1, 28*mm))

    # Logo / nome do produto
    story.append(Paragraph(
        'M<font color="#6D28D9">A</font>nalista',
        S["cover_title"]))
    story.append(Spacer(1, 3*mm))
    story.append(Paragraph("Laudo de Análise Multiprofissional Pediátrica", S["cover_sub"]))
    story.append(Spacer(1, 18*mm))

    # Linha decorativa
    story.append(HRFlowable(width="40%", thickness=1, color=C_PURPLE,
                            hAlign="CENTER", spaceAfter=12*mm))

    # Bloco de identificação central
    cover_block = Table([
        # Paciente
        [Paragraph("PACIENTE", S["cover_meta_label"])],
        [Paragraph(esc(child_name), S["cover_meta_value"])],
        [Paragraph(f"{age_y} anos e {age_m} meses · {esc(sex)}", S["cover_meta_sub"])],
        [Spacer(1, 8*mm)],
        # Data
        [Paragraph("DATA DA ANÁLISE", S["cover_meta_label"])],
        [Paragraph(datetime.now().strftime("%d de %B de %Y").replace("January", "Janeiro").replace("February", "Fevereiro").replace("March", "Março").replace("April", "Abril").replace("May", "Maio").replace("June", "Junho").replace("July", "Julho").replace("August", "Agosto").replace("September", "Setembro").replace("October", "Outubro").replace("November", "Novembro").replace("December", "Dezembro"), S["cover_meta_value"])],
        [Spacer(1, 8*mm)],
        # Equipe
        [Paragraph("EQUIPE TÉCNICA", S["cover_meta_label"])],
        [Paragraph("7 Especialistas + 1 Coordenador", S["cover_meta_value"])],
        [Paragraph("Análise multiprofissional integrada", S["cover_meta_sub"])],
    ], colWidths=[120*mm], hAlign="CENTER")
    cover_block.setStyle(TableStyle([
        ("TOPPADDING",    (0,0), (-1,-1), 0),
        ("BOTTOMPADDING", (0,0), (-1,-1), 0),
        ("LEFTPADDING",   (0,0), (-1,-1), 0),
        ("RIGHTPADDING",  (0,0), (-1,-1), 0),
    ]))
    story.append(cover_block)

    story.append(Spacer(1, 16*mm))
    story.append(HRFlowable(width="40%", thickness=1, color=C_PURPLE,
                            hAlign="CENTER", spaceAfter=8*mm))

    # Disclaimer destacado
    disclaimer_box = Table([[
        Paragraph(
            "<b>⚠ MODO DEMONSTRAÇÃO</b><br/>"
            "Este laudo é uma análise sugestiva sem validade diagnóstica real. "
            "Não substitui avaliação presencial por profissional habilitado.",
            ParagraphStyle("d", fontName="Helvetica", fontSize=9, textColor=C_CORAL,
                          leading=13, alignment=TA_CENTER))
    ]], colWidths=[120*mm], hAlign="CENTER")
    disclaimer_box.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), C_CORAL_BG),
        ("LINEBEFORE",    (0,0), (0,-1), 3, C_CORAL),
        ("TOPPADDING",    (0,0), (-1,-1), 10),
        ("BOTTOMPADDING", (0,0), (-1,-1), 10),
        ("LEFTPADDING",   (0,0), (-1,-1), 14),
        ("RIGHTPADDING",  (0,0), (-1,-1), 14),
    ]))
    story.append(disclaimer_box)
    story.append(PageBreak())

    # ──────────────────────────────────────────────────────────────────────
    # SEÇÃO 1 — RESUMO DO PACIENTE
    # ──────────────────────────────────────────────────────────────────────
    story.extend(section_header(
        "1.", "Resumo do Paciente",
        "Dados informados pelo responsável no momento da análise.",
        C_PURPLE, S))

    # Grid 2x col de dados básicos
    basic_data = [
        [info_card("Nome", child_name, S),
         info_card("Data de Nascimento", birthdate_br, S)],
        [info_card("Idade", f"{age_y} anos e {age_m} meses", S),
         info_card("Sexo Biológico", sex, S)],
        [info_card("Idade Gestacional", child.get("gestationalAge") or "—", S),
         info_card("Complicações no Parto", child.get("birthComplications") or "Nenhuma relatada", S)],
    ]
    basic_table = Table(basic_data, colWidths=[None, None])
    basic_table.setStyle(TableStyle([
        ("TOPPADDING",    (0,0), (-1,-1), 0),
        ("BOTTOMPADDING", (0,0), (-1,-1), 3),
        ("LEFTPADDING",   (0,0), (0,-1), 0),
        ("LEFTPADDING",   (1,0), (1,-1), 3),
        ("RIGHTPADDING",  (0,0), (0,-1), 3),
        ("RIGHTPADDING",  (1,0), (1,-1), 0),
        ("VALIGN",        (0,0), (-1,-1), "TOP"),
    ]))
    story.append(basic_table)

    # ──────────────────────────────────────────────────────────────────────
    # SEÇÃO 2 — QUEIXAS RELATADAS PELO RESPONSÁVEL
    # ──────────────────────────────────────────────────────────────────────
    story.extend(section_header(
        "2.", "Queixas Relatadas pelo Responsável",
        "Principais preocupações que motivaram a análise.",
        C_AMBER, S))

    main_complaints = child.get("mainComplaints", "").strip()
    duration = child.get("complaintDuration", "").strip()

    if main_complaints:
        # Extrair bullets do bloco "PREOCUPAÇÕES IDENTIFICADAS:"
        complaint_bullets = []
        text_lines = main_complaints.split("\n")
        in_concerns = False
        free_notes = []
        in_notes = False
        for ln in text_lines:
            ln = ln.strip()
            if "PREOCUPAÇÕES IDENTIFICADAS" in ln:
                in_concerns = True
                in_notes = False
                continue
            if "OBSERVAÇÕES ADICIONAIS" in ln:
                in_concerns = False
                in_notes = True
                continue
            if ln.startswith("Tempo de duração:"):
                in_concerns = False
                in_notes = False
                continue
            if in_concerns and ln.startswith("•"):
                complaint_bullets.append(ln[1:].strip())
            elif in_notes and ln:
                free_notes.append(ln)

        if complaint_bullets:
            story.append(bullet_list_card(
                "Preocupações Identificadas", complaint_bullets, S, C_AMBER))
            story.append(Spacer(1, 3*mm))

    if duration:
        story.append(info_card("Duração das Queixas", duration, S, C_AMBER))
        story.append(Spacer(1, 3*mm))

    # Observações livres (free text)
    if main_complaints and "OBSERVAÇÕES ADICIONAIS" in main_complaints:
        notes_idx = main_complaints.find("OBSERVAÇÕES ADICIONAIS")
        notes_text = main_complaints[notes_idx:].split(":", 1)[-1].strip()
        if notes_text:
            notes_card = Table([[
                Paragraph("OBSERVAÇÕES ADICIONAIS DO RESPONSÁVEL", S["label"]),
                Paragraph(esc(notes_text), S["body"]),
            ]], colWidths=[None])
            notes_card.setStyle(TableStyle([
                ("TOPPADDING",    (0,0), (-1,-1), 8),
                ("BOTTOMPADDING", (0,0), (-1,-1), 8),
                ("LEFTPADDING",   (0,0), (-1,-1), 12),
                ("RIGHTPADDING",  (0,0), (-1,-1), 12),
                ("BACKGROUND",    (0,0), (-1,-1), C_AMBER_BG),
                ("LINEBEFORE",    (0,0), (0,-1), 2.5, C_AMBER),
                ("VALIGN",        (0,0), (-1,-1), "TOP"),
            ]))
            # Header dentro
            notes_card = Table([[
                Paragraph("OBSERVAÇÕES ADICIONAIS DO RESPONSÁVEL", S["label"])],
                [Paragraph(esc(notes_text), S["body"])],
            ], colWidths=[None])
            notes_card.setStyle(TableStyle([
                ("TOPPADDING",    (0,0), (-1,-1), 6),
                ("BOTTOMPADDING", (0,0), (-1,-1), 6),
                ("LEFTPADDING",   (0,0), (-1,-1), 12),
                ("RIGHTPADDING",  (0,0), (-1,-1), 12),
                ("BACKGROUND",    (0,0), (-1,-1), C_AMBER_BG),
                ("LINEBEFORE",    (0,0), (0,-1), 2.5, C_AMBER),
                ("VALIGN",        (0,0), (-1,-1), "TOP"),
            ]))
            story.append(notes_card)

    # ──────────────────────────────────────────────────────────────────────
    # SEÇÃO 3 — DESENVOLVIMENTO INFORMADO
    # ──────────────────────────────────────────────────────────────────────
    story.extend(section_header(
        "3.", "Desenvolvimento Informado",
        "Marcos motores, de linguagem e sociais relatados pelo responsável.",
        C_BLUE, S))

    motor = child.get("motorMilestones", "").strip()
    language = child.get("languageMilestones", "").strip()
    social = child.get("socialMilestones", "").strip()

    dev_items = [
        ("Marcos Motores", motor or "Não informado", C_BLUE),
        ("Marcos de Linguagem", language or "Não informado", C_BLUE),
        ("Marcos Sociais", social or "Não informado", C_BLUE),
    ]
    for label, value, accent in dev_items:
        story.append(info_card(label, value, S, accent))
        story.append(Spacer(1, 2*mm))

    # ──────────────────────────────────────────────────────────────────────
    # SEÇÃO 4 — HISTÓRICO CLÍNICO INFORMADO
    # ──────────────────────────────────────────────────────────────────────
    story.extend(section_header(
        "4.", "Histórico Clínico Informado",
        "Diagnósticos, terapias e contexto familiar relatados.",
        C_GREEN, S))

    family_hist = child.get("familyHistory", "").strip()
    prev_diag = child.get("previousDiagnoses", "").strip()
    meds = child.get("currentMedications", "").strip()
    therapies = child.get("therapiesInProgress", "").strip()
    behavior_home = child.get("behaviorHome", "").strip()
    behavior_school = child.get("behaviorSchool", "").strip()

    # Histórico familiar (bullets se vier "•")
    if family_hist:
        bullets = split_bullets(family_hist)
        if bullets:
            story.append(bullet_list_card("Histórico Familiar", bullets, S, C_GREEN))
        else:
            story.append(info_card("Histórico Familiar", family_hist, S, C_GREEN))
        story.append(Spacer(1, 2*mm))

    story.append(info_card("Diagnósticos Anteriores", prev_diag or "Nenhum", S, C_GREEN))
    story.append(Spacer(1, 2*mm))
    story.append(info_card("Medicações Atuais", meds or "Nenhuma", S, C_GREEN))
    story.append(Spacer(1, 2*mm))
    story.append(info_card("Terapias em Andamento", therapies or "Nenhuma", S, C_GREEN))
    story.append(Spacer(1, 2*mm))

    # Comportamento (se preenchido)
    if behavior_home:
        bullets = split_bullets(behavior_home)
        if bullets:
            story.append(bullet_list_card("Comportamento em Casa", bullets, S, C_GREEN))
        else:
            story.append(info_card("Comportamento em Casa", behavior_home, S, C_GREEN))
        story.append(Spacer(1, 2*mm))
    if behavior_school:
        bullets = split_bullets(behavior_school)
        if bullets:
            story.append(bullet_list_card("Comportamento na Escola", bullets, S, C_GREEN))
        else:
            story.append(info_card("Comportamento na Escola", behavior_school, S, C_GREEN))
        story.append(Spacer(1, 2*mm))

    # ──────────────────────────────────────────────────────────────────────
    # GUARD: se não tem resultados, encerra aqui com aviso
    # ──────────────────────────────────────────────────────────────────────
    if not results:
        story.append(PageBreak())
        story.append(Spacer(1, 20*mm))
        story.append(Paragraph(
            "<b>⚠ Análise incompleta — resultados diagnósticos não disponíveis.</b>",
            S["disclaimer"]))
        story.append(Paragraph(
            "O laudo foi gerado parcialmente. Os dados do paciente foram registrados, "
            "mas a análise multiprofissional não pôde ser concluída.",
            S["body"]))
        return story

    res = results[0]
    primary_pathology = res.get("primaryPathology", "—")
    icd11 = res.get("icd11Code", "—")
    dsm5  = res.get("dsm5Code",  "—")
    conf  = res.get("confidence", "moderada")
    conf_color  = CONF_COLORS.get(conf, C_AMBER)
    conf_label  = CONF_LABELS.get(conf, conf)
    treatments  = res.get("treatmentSuggestions", [])
    sci_refs    = res.get("scientificRefs", [])
    supporting  = res.get("supportingAgents", [])

    # ──────────────────────────────────────────────────────────────────────
    # SEÇÃO 5 — PATOLOGIA PRINCIPAL IDENTIFICADA
    # ──────────────────────────────────────────────────────────────────────
    story.append(PageBreak())
    story.extend(section_header(
        "5.", "Patologia Principal Identificada",
        "Hipótese diagnóstica consolidada pela equipe multiprofissional.",
        C_PURPLE, S))

    path_block = Table([
        [Paragraph(esc(primary_pathology), S["path_main"])],
        [Paragraph(
            f'<font color="#64748B">CID-11</font>  <font color="#1D4ED8"><b>{esc(icd11)}</b></font>'
            f'  &nbsp;&nbsp;·&nbsp;&nbsp;  '
            f'<font color="#64748B">DSM-5</font>  <font color="#6D28D9"><b>{esc(dsm5)}</b></font>',
            S["path_codes"])],
    ], colWidths=[None])
    path_block.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), C_PURPLE_BG),
        ("LINEBEFORE",    (0,0), (0,-1), 3, C_PURPLE),
        ("LINEABOVE",     (0,0), (-1,0), 0.5, C_BORDER),
        ("LINEBELOW",     (0,-1), (-1,-1), 0.5, C_BORDER),
        ("LINEAFTER",     (-1,0), (-1,-1), 0.5, C_BORDER),
        ("TOPPADDING",    (0,0), (-1,-1), 14),
        ("BOTTOMPADDING", (0,0), (-1,-1), 14),
        ("LEFTPADDING",   (0,0), (-1,-1), 16),
        ("RIGHTPADDING",  (0,0), (-1,-1), 16),
    ]))
    story.append(path_block)

    # ──────────────────────────────────────────────────────────────────────
    # SEÇÃO 6 — ÍNDICES DE QUALIDADE
    # ──────────────────────────────────────────────────────────────────────
    story.extend(section_header(
        "6.", "Índices de Qualidade da Análise",
        "Métricas de confiabilidade da hipótese diagnóstica.",
        C_BLUE, S))

    n_agents = max(len(supporting), 1)
    kpi_cells = []
    for label, value, color in [
        ("Score de Qualidade", f"{int(quality_score)}%", C_PURPLE),
        ("Nível de Confiança", conf_label, conf_color),
        ("Especialistas em Consenso", f"{n_agents}/7", C_BLUE),
    ]:
        cell = Table([
            [Paragraph(esc(value),
                       ParagraphStyle("kv", fontName="Helvetica-Bold", fontSize=22,
                                     textColor=color, leading=26, alignment=TA_CENTER))],
            [Paragraph(esc(label), S["kpi_label"])],
        ], colWidths=[None])
        cell.setStyle(TableStyle([
            ("TOPPADDING",    (0,0), (-1,-1), 4),
            ("BOTTOMPADDING", (0,0), (-1,-1), 4),
            ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
        ]))
        kpi_cells.append(cell)

    kpi_table = Table([kpi_cells], colWidths=[None, None, None])
    kpi_table.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), C_BG_SOFT),
        ("BOX",           (0,0), (-1,-1), 0.5, C_BORDER),
        ("INNERGRID",     (0,0), (-1,-1), 0.5, C_BORDER),
        ("TOPPADDING",    (0,0), (-1,-1), 12),
        ("BOTTOMPADDING", (0,0), (-1,-1), 12),
        ("LEFTPADDING",   (0,0), (-1,-1), 6),
        ("RIGHTPADDING",  (0,0), (-1,-1), 6),
        ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
    ]))
    story.append(kpi_table)

    if quality_score > 0:
        story.append(Spacer(1, 6*mm))
        story.append(Paragraph("Score geral de qualidade da análise multiprofissional", S["label"]))
        story.append(progress_row("", quality_score, C_PURPLE, S))

    # ──────────────────────────────────────────────────────────────────────
    # SEÇÃO 7 — INDICADORES CLÍNICOS DETECTADOS
    # ──────────────────────────────────────────────────────────────────────
    if pathologies:
        story.extend(section_header(
            "7.", "Indicadores Clínicos Detectados",
            "Patologias identificadas pela equipe, com nível de evidência observado.",
            C_AMBER, S))

        for p in pathologies:
            pname = p.get("name", "")
            ppct  = p.get("percentage", 0)
            pevid = p.get("evidence", [])
            pcolor_hex = p.get("color", "#6D28D9")
            try:
                pcolor = colors.HexColor(pcolor_hex)
            except Exception:
                pcolor = C_PURPLE

            # Card por patologia
            inner = [
                [Paragraph(esc(pname), S["h3"])],
                [progress_row("", ppct, pcolor, S, bar_w=110*mm)],
            ]
            if pevid:
                inner.append([Spacer(1, 2*mm)])
                for ev in pevid[:4]:
                    inner.append([Paragraph(f"• {esc(ev)}", S["bullet"])])

            card = Table(inner, colWidths=[None])
            card.setStyle(TableStyle([
                ("TOPPADDING",    (0,0), (-1,-1), 2),
                ("BOTTOMPADDING", (0,0), (-1,-1), 2),
                ("LEFTPADDING",   (0,0), (-1,-1), 12),
                ("RIGHTPADDING",  (0,0), (-1,-1), 12),
                ("BACKGROUND",    (0,0), (-1,-1), C_BG_SOFT),
                ("LINEBEFORE",    (0,0), (0,-1), 2.5, pcolor),
            ]))
            outer = Table([[card]], colWidths=[None])
            outer.setStyle(TableStyle([
                ("TOPPADDING",    (0,0), (-1,-1), 4),
                ("BOTTOMPADDING", (0,0), (-1,-1), 4),
                ("LEFTPADDING",   (0,0), (-1,-1), 0),
                ("RIGHTPADDING",  (0,0), (-1,-1), 0),
            ]))
            story.append(KeepTogether([outer, Spacer(1, 2*mm)]))

    # ──────────────────────────────────────────────────────────────────────
    # SEÇÃO 8 — SÍNTESE DO DEBATE MULTIPROFISSIONAL
    # ──────────────────────────────────────────────────────────────────────
    if debate_messages:
        story.extend(section_header(
            "8.", "Síntese do Debate Multiprofissional",
            "Análise de cada especialista que compôs o diagnóstico consensual.",
            C_PURPLE, S))

        # Agrupa mensagens por agente, pega a primeira análise de cada
        analyses_by_agent = {}
        for msg in debate_messages:
            aid = msg.get("agentId")
            mtype = msg.get("type", "")
            if not aid or aid == "mediator":
                continue
            if aid not in analyses_by_agent and mtype in ("analysis", "debate"):
                analyses_by_agent[aid] = msg

        for aid, msg in analyses_by_agent.items():
            agent_name = AGENT_NAMES.get(aid, aid)
            spec_label = SPECIALIST_MAP.get(aid, (aid, ""))[0]
            content = strip_technical_json(msg.get("content", ""))
            # Limita para 4-5 linhas no PDF (síntese, não transcrição completa)
            if len(content) > 600:
                cut = content.rfind(".", 0, 600)
                content = content[:cut+1] if cut > 300 else content[:600] + "…"

            block = Table([
                [Paragraph(f"<b>{esc(agent_name)}</b>  <font color='#64748B' size='8'>· {esc(spec_label)}</font>",
                           S["agent_name"])],
                [Paragraph(esc(content), S["agent_speech"])],
            ], colWidths=[None])
            block.setStyle(TableStyle([
                ("TOPPADDING",    (0,0), (-1,-1), 4),
                ("BOTTOMPADDING", (0,0), (-1,-1), 4),
                ("LEFTPADDING",   (0,0), (-1,-1), 12),
                ("RIGHTPADDING",  (0,0), (-1,-1), 12),
                ("BACKGROUND",    (0,0), (-1,-1), C_BG_SOFT),
                ("LINEBEFORE",    (0,0), (0,-1), 2, C_PURPLE),
            ]))
            wrapped = Table([[block]], colWidths=[None])
            wrapped.setStyle(TableStyle([
                ("TOPPADDING",    (0,0), (-1,-1), 3),
                ("BOTTOMPADDING", (0,0), (-1,-1), 3),
                ("LEFTPADDING",   (0,0), (-1,-1), 0),
                ("RIGHTPADDING",  (0,0), (-1,-1), 0),
            ]))
            story.append(KeepTogether([wrapped, Spacer(1, 1*mm)]))

    # ──────────────────────────────────────────────────────────────────────
    # SEÇÃO 9 — ESPECIALISTAS RECOMENDADOS
    # ──────────────────────────────────────────────────────────────────────
    story.extend(section_header(
        "9.", "Especialistas Recomendados",
        "Profissionais indicados para avaliação presencial e confirmação diagnóstica.",
        C_GREEN, S))

    rec_agents = [a for a in (supporting or []) if a != "mediator"]
    if not rec_agents:
        rec_agents = ["neuropediatra", "psi-infantil"]

    for i, aid in enumerate(rec_agents[:4]):
        spec_name, spec_desc = SPECIALIST_MAP.get(aid, (aid, ""))
        priority_label = "PRIORITÁRIO" if i == 0 else "RECOMENDADO"
        priority_color = C_AMBER if i == 0 else C_BLUE
        priority_bg = C_AMBER_BG if i == 0 else C_BLUE_BG

        # Badge de prioridade
        badge = Table([[Paragraph(priority_label, S["badge"])]], colWidths=[26*mm])
        badge.setStyle(TableStyle([
            ("BACKGROUND",    (0,0), (-1,-1), priority_color),
            ("TOPPADDING",    (0,0), (-1,-1), 4),
            ("BOTTOMPADDING", (0,0), (-1,-1), 4),
            ("ROUNDEDCORNERS",[3]),
            ("ALIGN",         (0,0), (-1,-1), "CENTER"),
            ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
        ]))

        spec_row = Table([[
            Paragraph(f"<b>{i+1}</b>",
                      ParagraphStyle("sn", fontName="Helvetica-Bold", fontSize=18,
                                     textColor=priority_color, alignment=TA_CENTER)),
            [
                Paragraph(esc(spec_name), S["spec_name"]),
                Paragraph(esc(spec_desc), S["spec_desc"]),
            ],
            badge,
        ]], colWidths=[12*mm, None, 28*mm])
        spec_row.setStyle(TableStyle([
            ("BACKGROUND",    (0,0), (-1,-1), priority_bg),
            ("LINEBEFORE",    (0,0), (0,-1), 3, priority_color),
            ("TOPPADDING",    (0,0), (-1,-1), 10),
            ("BOTTOMPADDING", (0,0), (-1,-1), 10),
            ("LEFTPADDING",   (0,0), (-1,-1), 10),
            ("RIGHTPADDING",  (0,0), (-1,-1), 10),
            ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
        ]))
        story.append(KeepTogether([spec_row]))
        story.append(Spacer(1, 3*mm))

    # ──────────────────────────────────────────────────────────────────────
    # SEÇÃO 10 — PLANO DE TRATAMENTO SUGERIDO
    # ──────────────────────────────────────────────────────────────────────
    if treatments:
        story.extend(section_header(
            "10.", "Plano de Tratamento Sugerido",
            "Modalidades terapêuticas indicadas, classificadas por nível de evidência.",
            C_CORAL, S))

        for t in treatments:
            modality = t.get("modality", "")
            desc     = t.get("description", "")
            ev       = t.get("evidenceLevel", "B")
            ev_color = EV_COLORS.get(ev, C_AMBER)
            ev_label = EV_LABELS.get(ev, f"Nível {ev}")
            ev_bg    = C_GREEN_BG if ev == "A" else (C_AMBER_BG if ev == "B" else C_CORAL_BG)

            # Badge de evidência
            ev_badge = Table([[Paragraph(f"<b>{ev}</b>",
                ParagraphStyle("eb", fontName="Helvetica-Bold", fontSize=16,
                              textColor=C_BG, alignment=TA_CENTER))]],
                colWidths=[14*mm], rowHeights=[14*mm])
            ev_badge.setStyle(TableStyle([
                ("BACKGROUND",    (0,0), (-1,-1), ev_color),
                ("ALIGN",         (0,0), (-1,-1), "CENTER"),
                ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
                ("ROUNDEDCORNERS",[3]),
            ]))

            t_row = Table([[
                ev_badge,
                [
                    Paragraph(esc(modality), S["h3"]),
                    Paragraph(esc(ev_label),
                              ParagraphStyle("el", fontName="Helvetica", fontSize=8,
                                            textColor=ev_color, leading=11, spaceAfter=4)),
                    md_para(desc, S["body"]),
                ],
            ]], colWidths=[18*mm, None])
            t_row.setStyle(TableStyle([
                ("BACKGROUND",    (0,0), (-1,-1), ev_bg),
                ("LINEBEFORE",    (0,0), (0,-1), 3, ev_color),
                ("TOPPADDING",    (0,0), (-1,-1), 10),
                ("BOTTOMPADDING", (0,0), (-1,-1), 10),
                ("LEFTPADDING",   (0,0), (-1,-1), 10),
                ("RIGHTPADDING",  (0,0), (-1,-1), 10),
                ("VALIGN",        (0,0), (-1,-1), "TOP"),
            ]))
            story.append(KeepTogether([t_row]))
            story.append(Spacer(1, 3*mm))

    # ──────────────────────────────────────────────────────────────────────
    # SEÇÃO 11 — REFERÊNCIAS CIENTÍFICAS
    # ──────────────────────────────────────────────────────────────────────
    if sci_refs:
        story.extend(section_header(
            "11.", "Referências Científicas",
            "Literatura técnica que fundamentou a análise da equipe.",
            C_MUTED, S))

        for i, ref in enumerate(sci_refs):
            authors = ref.get("authors", "")
            year    = ref.get("year", "")
            title   = ref.get("title", "")
            journal = ref.get("journal", "")
            doi     = ref.get("doi", "")
            doi_part = f". DOI: {esc(doi)}" if doi else ""
            story.append(Paragraph(
                f"<b>[{i+1}]</b> {esc(authors)} ({esc(str(year))}). "
                f"<i>{esc(title)}</i>. {esc(journal)}{doi_part}.",
                S["ref"]))

    # ──────────────────────────────────────────────────────────────────────
    # DISCLAIMER FINAL
    # ──────────────────────────────────────────────────────────────────────
    story.append(Spacer(1, 10*mm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=C_BORDER, spaceAfter=8))

    final_disclaimer = Table([[
        Paragraph(
            "<b>Aviso legal — MAnalista</b><br/><br/>"
            "Este laudo foi gerado por agentes de Inteligência Artificial em "
            "<b>MODO DEMONSTRAÇÃO</b>. Não constitui diagnóstico médico real, "
            "não tem validade clínica e não substitui avaliação presencial por "
            "profissional de saúde habilitado. Os nomes dos especialistas utilizados "
            "são fictícios e qualquer semelhança com pessoas reais é mera coincidência. "
            "Os números de registro profissional contêm o sufixo <b>-F</b> indicando "
            "natureza fictícia.<br/><br/>"
            "Para confirmação diagnóstica e tratamento, consulte os profissionais "
            "recomendados na Seção 9 deste laudo.",
            S["disclaimer_body"])
    ]], colWidths=[None])
    final_disclaimer.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), C_BG_SOFT),
        ("LINEBEFORE",    (0,0), (0,-1), 2, C_MUTED),
        ("TOPPADDING",    (0,0), (-1,-1), 12),
        ("BOTTOMPADDING", (0,0), (-1,-1), 12),
        ("LEFTPADDING",   (0,0), (-1,-1), 14),
        ("RIGHTPADDING",  (0,0), (-1,-1), 14),
    ]))
    story.append(final_disclaimer)

    return story

# ══════════════════════════════════════════════════════════════════════════
#  ENTRY POINT
# ══════════════════════════════════════════════════════════════════════════
def generate(input_path, output_path):
    with open(input_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    child_name = data.get("childData", {}).get("name", "Paciente")
    date_str   = datetime.now().strftime("%d/%m/%Y %H:%M")

    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=15*mm, rightMargin=15*mm,
        topMargin=20*mm, bottomMargin=18*mm,
        title=f"MAnalista — Laudo de {child_name}",
        author="MAnalista AI",
        subject="Laudo de Análise Multiprofissional Pediátrica",
    )

    bg = LightBackground(child_name, date_str)
    styles = make_styles()
    story = build_story(data, styles)
    doc.build(story, onFirstPage=bg, onLaterPages=bg)
    print(f"PDF gerado: {output_path}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Uso: python3 generate_pdf.py <input.json> <output.pdf>")
        sys.exit(1)
    generate(sys.argv[1], sys.argv[2])
