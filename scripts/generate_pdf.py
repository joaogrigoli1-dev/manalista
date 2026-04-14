#!/usr/bin/env python3
"""MAnalista — Gerador de Laudo Final PDF"""
import sys, json, re
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether, PageBreak
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY

W, H = A4

# ── Paleta ─────────────────────────────────────────────────────────────────
C_BG     = colors.HexColor("#0F1117")
C_CARD   = colors.HexColor("#14192A")
C_CARD2  = colors.HexColor("#111827")
C_PURPLE = colors.HexColor("#7C5CFC")
C_BLUE   = colors.HexColor("#3B9BF5")
C_GREEN  = colors.HexColor("#10B981")
C_AMBER  = colors.HexColor("#F59E0B")
C_CORAL  = colors.HexColor("#E5725C")
C_WHITE  = colors.HexColor("#F1F5F9")
C_LIGHT  = colors.HexColor("#CBD5E1")
C_MUTED  = colors.HexColor("#64748B")
C_BORDER = colors.HexColor("#1E2A3A")
C_BORDER2 = colors.HexColor("#253047")

SPECIALIST_MAP = {
    "psi-infantil":      ("Psicólogo(a) Infantil",         "Avaliação e terapia psicológica para crianças"),
    "psi-parentalidade": ("Psicólogo(a) — Orientação Familiar", "Suporte parental e estratégias de parentalidade"),
    "neuropsico":        ("Neuropsicólogo(a)",              "Avaliação neuropsicológica e cognitiva"),
    "neuropediatra":     ("Neuropediatra",                  "Avaliação neurológica pediátrica"),
    "bcba":              ("Analista do Comportamento (BCBA)","Intervenção baseada em ABA/comportamento"),
    "fonoaudiologia":    ("Fonoaudiólogo(a)",               "Avaliação e terapia de linguagem e comunicação"),
    "terapeuta-ocupacional": ("Terapeuta Ocupacional",      "Integração sensorial e habilidades adaptativas"),
    "psiquiatra-infantil":("Psiquiatra Infantil",           "Avaliação psiquiátrica e manejo medicamentoso"),
}

CONF_LABELS = {"alta": "Alta", "moderada": "Moderada", "baixa": "Baixa"}
CONF_COLORS = {"alta": C_GREEN, "moderada": C_AMBER, "baixa": C_CORAL}
CONF_PCT    = {"alta": 90, "moderada": 65, "baixa": 35}
EV_COLORS   = {"A": C_GREEN, "B": C_AMBER, "C": C_CORAL}
EV_LABELS   = {"A": "Evidência A — Forte", "B": "Evidência B — Moderada", "C": "Evidência C — Preliminar"}

def esc(t):
    return str(t).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

def md_para(text, style):
    t = esc(text)
    t = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', t)
    t = re.sub(r'\*(.+?)\*',     r'<i>\1</i>', t)
    t = re.sub(r'`(.+?)`', r'<font name="Courier">\1</font>', t)
    return Paragraph(t, style)

def strip_md(text):
    t = re.sub(r'\*\*(.+?)\*\*', r'\1', text)
    t = re.sub(r'\*(.+?)\*',     r'\1', t)
    t = re.sub(r'#{1,6}\s*',     '',   t)
    return t.strip()

# ── Estilos ─────────────────────────────────────────────────────────────────
def make_styles():
    return {
        "cover_title": ParagraphStyle("cover_title",
            fontName="Helvetica-Bold", fontSize=38, textColor=C_WHITE,
            leading=44, alignment=TA_CENTER, spaceAfter=6),
        "cover_sub": ParagraphStyle("cover_sub",
            fontName="Helvetica", fontSize=14, textColor=C_LIGHT,
            leading=19, alignment=TA_CENTER, spaceAfter=4),
        "cover_meta": ParagraphStyle("cover_meta",
            fontName="Helvetica", fontSize=10, textColor=C_MUTED,
            alignment=TA_CENTER, spaceAfter=2),
        "section_title": ParagraphStyle("section_title",
            fontName="Helvetica-Bold", fontSize=9, textColor=C_PURPLE,
            leading=12, spaceAfter=5, spaceBefore=14,
            textTransform="uppercase", charSpace=1),
        "path_main": ParagraphStyle("path_main",
            fontName="Helvetica-Bold", fontSize=18, textColor=C_WHITE,
            leading=22, spaceAfter=4, alignment=TA_CENTER),
        "path_sub": ParagraphStyle("path_sub",
            fontName="Helvetica", fontSize=10, textColor=C_LIGHT,
            leading=14, spaceAfter=2, alignment=TA_CENTER),
        "kpi_value": ParagraphStyle("kpi_value",
            fontName="Helvetica-Bold", fontSize=22, textColor=C_WHITE,
            leading=26, alignment=TA_CENTER),
        "kpi_label": ParagraphStyle("kpi_label",
            fontName="Helvetica", fontSize=8, textColor=C_MUTED,
            leading=10, alignment=TA_CENTER, spaceAfter=2),
        "h3": ParagraphStyle("h3",
            fontName="Helvetica-Bold", fontSize=10, textColor=C_WHITE,
            leading=13, spaceAfter=3, spaceBefore=6),
        "h4": ParagraphStyle("h4",
            fontName="Helvetica-Bold", fontSize=9, textColor=C_LIGHT,
            leading=12, spaceAfter=2, spaceBefore=4),
        "body": ParagraphStyle("body",
            fontName="Helvetica", fontSize=9, textColor=C_LIGHT,
            leading=14, spaceAfter=3, alignment=TA_JUSTIFY),
        "body_bold": ParagraphStyle("body_bold",
            fontName="Helvetica-Bold", fontSize=9, textColor=C_WHITE,
            leading=13, spaceAfter=2),
        "bullet": ParagraphStyle("bullet",
            fontName="Helvetica", fontSize=9, textColor=C_LIGHT,
            leading=13, leftIndent=14, spaceAfter=2, bulletIndent=4),
        "label": ParagraphStyle("label",
            fontName="Helvetica-Bold", fontSize=7, textColor=C_MUTED,
            leading=9, spaceAfter=4, spaceBefore=8, charSpace=1),
        "badge_text": ParagraphStyle("badge_text",
            fontName="Helvetica-Bold", fontSize=8, textColor=C_WHITE,
            alignment=TA_CENTER),
        "ref": ParagraphStyle("ref",
            fontName="Helvetica", fontSize=8, textColor=C_MUTED,
            leading=11, leftIndent=12, spaceAfter=3),
        "disclaimer": ParagraphStyle("disclaimer",
            fontName="Helvetica", fontSize=8, textColor=C_AMBER,
            leading=12, alignment=TA_CENTER),
        "footer": ParagraphStyle("footer",
            fontName="Helvetica", fontSize=7, textColor=C_MUTED,
            alignment=TA_CENTER),
        "spec_name": ParagraphStyle("spec_name",
            fontName="Helvetica-Bold", fontSize=10, textColor=C_WHITE,
            leading=13, spaceAfter=1),
        "spec_desc": ParagraphStyle("spec_desc",
            fontName="Helvetica", fontSize=8.5, textColor=C_MUTED,
            leading=11, spaceAfter=0),
    }

# ── Dark background on every page ──────────────────────────────────────────
class DarkBackground:
    def __init__(self, child_name, date_str):
        self.child_name = child_name
        self.date_str = date_str

    def __call__(self, canv, doc):
        canv.saveState()
        canv.setFillColor(C_BG)
        canv.rect(0, 0, W, H, fill=1, stroke=0)
        # Top band
        canv.setFillColor(colors.HexColor("#0D1020"))
        canv.rect(0, H - 18*mm, W, 18*mm, fill=1, stroke=0)
        canv.setStrokeColor(C_PURPLE)
        canv.setLineWidth(2)
        canv.line(15*mm, H - 18*mm, W - 15*mm, H - 18*mm)
        # Header text
        canv.setFont("Helvetica-Bold", 8)
        canv.setFillColor(C_PURPLE)
        canv.drawString(15*mm, H - 13*mm, "MAnalista")
        canv.setFont("Helvetica", 7)
        canv.setFillColor(C_MUTED)
        canv.drawCentredString(W/2, H - 13*mm, f"Laudo de Análise Multiprofissional — {self.child_name}")
        canv.drawRightString(W - 15*mm, H - 13*mm, self.date_str)
        # Footer
        canv.setStrokeColor(C_BORDER)
        canv.setLineWidth(0.5)
        canv.line(15*mm, 14*mm, W - 15*mm, 14*mm)
        canv.setFont("Helvetica", 7)
        canv.setFillColor(C_MUTED)
        canv.drawCentredString(W/2, 9*mm, "MODO DEMONSTRAÇÃO — Não constitui diagnóstico real. Consulte profissionais habilitados.")
        canv.drawRightString(W - 15*mm, 9*mm, f"Pág. {doc.page}")
        canv.restoreState()

# ── Progress bar helper ─────────────────────────────────────────────────────
def progress_row(label, pct, bar_color, S, bar_w=130*mm):
    pct_int = max(0, min(100, int(pct)))
    filled = bar_w * pct_int / 100
    empty  = bar_w - filled
    bar = Table([[
        Paragraph("", ParagraphStyle("x")),
        Paragraph("", ParagraphStyle("x")),
    ]], colWidths=[filled if filled > 0 else 0.1, empty if empty > 0 else 0.1], rowHeights=[5])
    bar_style = [
        ("TOPPADDING",    (0,0), (-1,-1), 0),
        ("BOTTOMPADDING", (0,0), (-1,-1), 0),
        ("LEFTPADDING",   (0,0), (-1,-1), 0),
        ("RIGHTPADDING",  (0,0), (-1,-1), 0),
        ("ROWBACKGROUNDS",(0,0), (-1,-1), [bar_color, C_BORDER]),
        ("ROUNDEDCORNERS",[3],),
    ]
    bar.setStyle(TableStyle(bar_style))
    row = Table([[
        Paragraph(esc(label), S["body"]),
        bar,
        Paragraph(f"<b>{pct_int}%</b>",
                  ParagraphStyle("pctv", fontName="Helvetica-Bold", fontSize=9,
                                 textColor=bar_color, alignment=TA_RIGHT)),
    ]], colWidths=[None, bar_w, 14*mm])
    row.setStyle(TableStyle([
        ("TOPPADDING",    (0,0), (-1,-1), 3),
        ("BOTTOMPADDING", (0,0), (-1,-1), 3),
        ("LEFTPADDING",   (0,0), (-1,-1), 0),
        ("RIGHTPADDING",  (0,0), (-1,-1), 0),
        ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
    ]))
    return row

# ── Section header block ────────────────────────────────────────────────────
def section_block(label, accent_color, S):
    elems = []
    elems.append(Spacer(1, 5*mm))
    elems.append(Paragraph(label, S["section_title"]))
    elems.append(HRFlowable(width="100%", thickness=1.5, color=accent_color, spaceAfter=5))
    return elems

# ── Main story builder ──────────────────────────────────────────────────────
def build_story(data, styles):
    S = styles
    story = []
    pt = data.get("lang", "pt") == "pt"
    child = data.get("childData", {})
    results = data.get("results", [])
    pathologies = data.get("detectedPathologies", [])
    quality_score = data.get("qualityScore", 0)
    child_name = child.get("name", "—")
    age_y = child.get("ageYears", 0)
    age_m = child.get("ageMonths", 0)
    sex_map = {"M": "Masculino", "F": "Feminino", "outro": "Outro"}
    sex = sex_map.get(child.get("sex", "M"), "—")

    # ── COVER ───────────────────────────────────────────────────────────────
    story.append(Spacer(1, 38*mm))
    story.append(Paragraph("M<font color='#7C5CFC'>A</font>nalista", S["cover_title"]))
    story.append(Spacer(1, 1.5*mm))
    story.append(Paragraph("Laudo de Análise Multiprofissional Pediátrica", S["cover_sub"]))
    story.append(Spacer(1, 9*mm))

    # Patient info table
    cv_style = ParagraphStyle("cv", fontName="Helvetica-Bold", fontSize=11, textColor=C_WHITE, alignment=TA_CENTER)
    cv2_style = ParagraphStyle("cv2", fontName="Helvetica", fontSize=10, textColor=C_LIGHT, alignment=TA_CENTER)
    cover_table = Table([
        [Paragraph("<b>Paciente</b>", S["badge_text"]),
         Paragraph("<b>Idade</b>",    S["badge_text"]),
         Paragraph("<b>Sexo</b>",     S["badge_text"]),
         Paragraph("<b>Data</b>",     S["badge_text"])],
        [Paragraph(esc(child_name), cv_style),
         Paragraph(f"{age_y}a {age_m}m", cv2_style),
         Paragraph(esc(sex), cv2_style),
         Paragraph(datetime.now().strftime("%d/%m/%Y"), cv2_style)],
    ], colWidths=[42*mm, 32*mm, 36*mm, 38*mm])
    cover_table.setStyle(TableStyle([
        ("BACKGROUND",  (0,0), (-1,0), colors.HexColor("#1A2035")),
        ("BACKGROUND",  (0,1), (-1,1), colors.HexColor("#141929")),
        ("BOX",         (0,0), (-1,-1), 1, C_PURPLE),
        ("INNERGRID",   (0,0), (-1,-1), 0.3, C_BORDER),
        ("TOPPADDING",    (0,0), (-1,-1), 7),
        ("BOTTOMPADDING", (0,0), (-1,-1), 7),
        ("LEFTPADDING",   (0,0), (-1,-1), 6),
        ("RIGHTPADDING",  (0,0), (-1,-1), 6),
    ]))
    story.append(cover_table)
    story.append(Spacer(1, 9*mm))
    story.append(Paragraph(
        "⚠  MODO DEMONSTRAÇÃO — Este laudo é uma sugestão hipotética sem validade diagnóstica real.",
        S["disclaimer"]))
    story.append(PageBreak())

    # ── Guard: no results ───────────────────────────────────────────────────
    if not results:
        story.append(Spacer(1, 20*mm))
        story.append(Paragraph("Análise incompleta — sem resultados disponíveis.", S["body"]))
        return story

    res = results[0]
    primary_pathology = res.get("primaryPathology", "—")
    icd11 = res.get("icd11Code", "—")
    dsm5  = res.get("dsm5Code",  "—")
    conf  = res.get("confidence", "moderada")
    conf_color  = CONF_COLORS.get(conf, C_AMBER)
    conf_label  = CONF_LABELS.get(conf, conf)
    conf_pct    = CONF_PCT.get(conf, 65)
    treatments  = res.get("treatmentSuggestions", [])
    sci_refs    = res.get("scientificRefs", [])
    supporting  = res.get("supportingAgents", [])

    # ── 1. PATOLOGIA PRINCIPAL ───────────────────────────────────────────────
    story.extend(section_block("1. Patologia Principal Identificada", C_PURPLE, S))

    path_block = Table([[
        Paragraph(esc(primary_pathology), S["path_main"]),
    ]], colWidths=[None])
    path_block.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), colors.HexColor("#12183A")),
        ("BOX",           (0,0), (-1,-1), 1.5, C_PURPLE),
        ("LINEBELOW",     (0,0), (-1,0), 3, C_PURPLE),
        ("TOPPADDING",    (0,0), (-1,-1), 14),
        ("BOTTOMPADDING", (0,0), (-1,-1), 14),
        ("LEFTPADDING",   (0,0), (-1,-1), 12),
        ("RIGHTPADDING",  (0,0), (-1,-1), 12),
    ]))
    story.append(path_block)
    story.append(Spacer(1, 4*mm))

    # Codes row
    codes = Table([[
        Paragraph(f"<font color='#64748B'>CID-11</font>  <b>{esc(icd11)}</b>",
                  ParagraphStyle("c1", fontName="Helvetica", fontSize=10, textColor=C_BLUE, alignment=TA_CENTER)),
        Paragraph(f"<font color='#64748B'>DSM-5</font>  <b>{esc(dsm5)}</b>",
                  ParagraphStyle("c2", fontName="Helvetica", fontSize=10, textColor=C_PURPLE, alignment=TA_CENTER)),
    ]], colWidths=[None, None])
    codes.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), colors.HexColor("#0E1629")),
        ("BOX",           (0,0), (-1,-1), 0.5, C_BORDER),
        ("INNERGRID",     (0,0), (-1,-1), 0.5, C_BORDER),
        ("TOPPADDING",    (0,0), (-1,-1), 9),
        ("BOTTOMPADDING", (0,0), (-1,-1), 9),
        ("LEFTPADDING",   (0,0), (-1,-1), 8),
        ("RIGHTPADDING",  (0,0), (-1,-1), 8),
    ]))
    story.append(codes)

    # ── 2. ÍNDICES DE QUALIDADE ──────────────────────────────────────────────
    story.extend(section_block("2. Índices de Qualidade da Análise", C_BLUE, S))

    # KPI row: quality score + confidence + agents
    n_agents = max(len(supporting), 1)
    kpi_data = [[
        # Quality score
        Table([[
            Paragraph(f"{int(quality_score)}%", S["kpi_value"]),
            Paragraph("Score de Qualidade", S["kpi_label"]),
        ]]),
        # Confidence
        Table([[
            Paragraph(f"<b>{esc(conf_label)}</b>",
                      ParagraphStyle("cv", fontName="Helvetica-Bold", fontSize=18,
                                     textColor=conf_color, leading=22, alignment=TA_CENTER)),
            Paragraph("Nível de Confiança", S["kpi_label"]),
        ]]),
        # Agents consensus
        Table([[
            Paragraph(f"{n_agents}/6",
                      ParagraphStyle("cv2", fontName="Helvetica-Bold", fontSize=18,
                                     textColor=C_BLUE, leading=22, alignment=TA_CENTER)),
            Paragraph("Especialistas em Consenso", S["kpi_label"]),
        ]]),
    ]]
    for t in kpi_data[0]:
        t.setStyle(TableStyle([
            ("TOPPADDING",    (0,0), (-1,-1), 3),
            ("BOTTOMPADDING", (0,0), (-1,-1), 3),
            ("LEFTPADDING",   (0,0), (-1,-1), 4),
            ("RIGHTPADDING",  (0,0), (-1,-1), 4),
        ]))
    kpi_table = Table(kpi_data, colWidths=[None, None, None])
    kpi_table.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), colors.HexColor("#0E1629")),
        ("BOX",           (0,0), (-1,-1), 0.5, C_BORDER),
        ("INNERGRID",     (0,0), (-1,-1), 0.5, C_BORDER),
        ("TOPPADDING",    (0,0), (-1,-1), 10),
        ("BOTTOMPADDING", (0,0), (-1,-1), 10),
        ("LEFTPADDING",   (0,0), (-1,-1), 6),
        ("RIGHTPADDING",  (0,0), (-1,-1), 6),
        ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
        ("LINEBELOW",     (0,0), (0,0), 2, C_PURPLE),
        ("LINEBELOW",     (1,0), (1,0), 2, conf_color),
        ("LINEBELOW",     (2,0), (2,0), 2, C_BLUE),
    ]))
    story.append(kpi_table)

    # Confidence bar
    if quality_score > 0:
        story.append(Spacer(1, 5*mm))
        story.append(Paragraph("Score geral de qualidade da análise multiprofissional", S["label"]))
        story.append(progress_row("", quality_score, C_PURPLE, S))

    # ── 3. INDICADORES CLÍNICOS DETECTADOS ─────────────────────────────────
    if pathologies:
        story.extend(section_block("3. Indicadores Clínicos Detectados", C_AMBER, S))
        story.append(Paragraph(
            "Os indicadores abaixo foram extraídos da análise dos dados informados pelo responsável.",
            S["body"]))
        story.append(Spacer(1, 3*mm))

        for p in pathologies:
            pname = p.get("name", "")
            ppct  = p.get("percentage", 0)
            pevid = p.get("evidence", [])
            pcolor_hex = p.get("color", "#7C5CFC")
            try:
                pcolor = colors.HexColor(pcolor_hex)
            except Exception:
                pcolor = C_PURPLE

            story.append(Paragraph(esc(pname), S["h3"]))
            story.append(progress_row("", ppct, pcolor, S))
            if pevid:
                story.append(Spacer(1, 2*mm))
                for ev in pevid[:4]:  # max 4 evidence items per pathology
                    story.append(Paragraph(f"• {esc(ev)}", S["bullet"]))
            story.append(Spacer(1, 3*mm))

    elif results[0].get("supportingAgents"):
        # Fallback: show secondary pathologies as indicator bars if detectedPathologies is empty
        story.extend(section_block("3. Indicadores Clínicos Detectados", C_AMBER, S))
        story.append(Paragraph("Indicadores identificados com base no consenso da equipe:", S["body"]))
        story.append(Spacer(1, 3*mm))
        story.append(Paragraph(f"• {esc(primary_pathology)}", S["bullet"]))

    # ── 4. ESPECIALISTAS RECOMENDADOS ───────────────────────────────────────
    story.extend(section_block("4. Especialistas Recomendados", C_GREEN, S))
    story.append(Paragraph(
        "Com base na análise, os seguintes profissionais são indicados para avaliação presencial:",
        S["body"]))
    story.append(Spacer(1, 4*mm))

    rec_agents = supporting if supporting else list(SPECIALIST_MAP.keys())[:2]
    # Remove mediator from recommendations
    rec_agents = [a for a in rec_agents if a != "mediator"]
    if not rec_agents:
        rec_agents = ["neuropediatra", "psi-infantil"]

    urgency_colors = {0: C_GREEN, 1: C_AMBER}
    for i, aid in enumerate(rec_agents[:4]):  # max 4
        spec_name, spec_desc = SPECIALIST_MAP.get(aid, (aid, ""))
        priority_label = "PRIORITÁRIO" if i == 0 else "RECOMENDADO"
        priority_color = C_AMBER if i == 0 else C_BLUE

        spec_row = Table([[
            Table([[
                Paragraph(f"<b>{i+1}</b>",
                          ParagraphStyle("sn", fontName="Helvetica-Bold", fontSize=14,
                                         textColor=priority_color, alignment=TA_CENTER)),
            ]], colWidths=[8*mm]),
            [
                Paragraph(esc(spec_name), S["spec_name"]),
                Paragraph(esc(spec_desc), S["spec_desc"]),
            ],
            Paragraph(f"<b>{priority_label}</b>",
                      ParagraphStyle("pr", fontName="Helvetica-Bold", fontSize=7,
                                     textColor=priority_color, alignment=TA_CENTER)),
        ]], colWidths=[12*mm, None, 28*mm])
        spec_row.setStyle(TableStyle([
            ("BACKGROUND",    (0,0), (-1,-1), colors.HexColor("#0E1629")),
            ("BOX",           (0,0), (-1,-1), 0.5, C_BORDER),
            ("LINEBELOW",     (0,0), (-1,0), 1.5, priority_color),
            ("TOPPADDING",    (0,0), (-1,-1), 9),
            ("BOTTOMPADDING", (0,0), (-1,-1), 9),
            ("LEFTPADDING",   (0,0), (-1,-1), 7),
            ("RIGHTPADDING",  (0,0), (-1,-1), 7),
            ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
        ]))
        story.append(KeepTogether([spec_row]))
        story.append(Spacer(1, 2.5*mm))

    # ── 5. PLANO DE TRATAMENTO SUGERIDO ────────────────────────────────────
    if treatments:
        story.extend(section_block("5. Plano de Tratamento Sugerido", C_CORAL, S))
        story.append(Paragraph(
            "Modalidades terapêuticas indicadas com nível de evidência científica:",
            S["body"]))
        story.append(Spacer(1, 4*mm))

        for t in treatments:
            modality = t.get("modality", "")
            desc     = t.get("description", "")
            ev       = t.get("evidenceLevel", "B")
            ev_color = EV_COLORS.get(ev, C_AMBER)
            ev_label = EV_LABELS.get(ev, f"Nível {ev}")

            t_row = Table([[
                Paragraph(f"<b>{esc(ev)}</b>",
                          ParagraphStyle("evl", fontName="Helvetica-Bold", fontSize=13,
                                         textColor=ev_color, alignment=TA_CENTER)),
                [
                    Paragraph(esc(modality), S["h3"]),
                    Paragraph(esc(ev_label),
                              ParagraphStyle("evd", fontName="Helvetica", fontSize=7.5,
                                             textColor=ev_color, leading=10)),
                    Spacer(1, 2*mm),
                    md_para(desc, S["body"]),
                ],
            ]], colWidths=[14*mm, None])
            t_row.setStyle(TableStyle([
                ("BACKGROUND",    (0,0), (-1,-1), colors.HexColor("#0E1629")),
                ("BOX",           (0,0), (-1,-1), 0.5, C_BORDER),
                ("LINEBELOW",     (0,0), (-1,0), 2, ev_color),
                ("TOPPADDING",    (0,0), (-1,-1), 8),
                ("BOTTOMPADDING", (0,0), (-1,-1), 8),
                ("LEFTPADDING",   (0,0), (-1,-1), 7),
                ("RIGHTPADDING",  (0,0), (-1,-1), 7),
                ("VALIGN",        (0,0), (-1,-1), "TOP"),
            ]))
            story.append(KeepTogether([t_row]))
            story.append(Spacer(1, 3*mm))

    # ── 6. REFERÊNCIAS CIENTÍFICAS ──────────────────────────────────────────
    if sci_refs:
        story.extend(section_block("6. Referências Científicas", C_MUTED, S))
        for i, ref in enumerate(sci_refs):
            authors = ref.get("authors", "")
            year    = ref.get("year", "")
            title   = ref.get("title", "")
            journal = ref.get("journal", "")
            doi     = ref.get("doi", "")
            doi_part = f". DOI: {esc(doi)}" if doi else ""
            story.append(Paragraph(
                f"[{i+1}] {esc(authors)} ({esc(str(year))}). "
                f"<i>{esc(title)}</i>. {esc(journal)}{doi_part}.",
                S["ref"]))

    # ── DISCLAIMER ─────────────────────────────────────────────────────────
    story.append(Spacer(1, 12*mm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=C_BORDER, spaceAfter=7))
    story.append(Paragraph(
        "Este laudo foi gerado por agentes de IA em MODO DEMONSTRAÇÃO. "
        "Não constitui diagnóstico médico real, não tem validade clínica e "
        "não substitui avaliação presencial por profissional de saúde habilitado. "
        "Os nomes de especialistas utilizados são fictícios.",
        S["disclaimer"]))

    return story

# ── Entry point ─────────────────────────────────────────────────────────────
def generate(input_path, output_path):
    with open(input_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    child_name = data.get("childData", {}).get("name", "Paciente")
    date_str   = datetime.now().strftime("%d/%m/%Y %H:%M")

    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=15*mm, rightMargin=15*mm,
        topMargin=22*mm, bottomMargin=20*mm,
        title=f"MAnalista — Laudo de {child_name}",
        author="MAnalista AI",
        subject="Laudo de Análise Multiprofissional Pediátrica",
    )

    bg = DarkBackground(child_name, date_str)
    styles = make_styles()
    story = build_story(data, styles)
    doc.build(story, onFirstPage=bg, onLaterPages=bg)
    print(f"PDF gerado: {output_path}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Uso: python3 generate_pdf.py <input.json> <output.pdf>")
        sys.exit(1)
    generate(sys.argv[1], sys.argv[2])
