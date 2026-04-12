#!/usr/bin/env python3
"""MAnalista — Gerador de Relatório PDF Profissional"""
import sys, json, re, textwrap
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether, PageBreak, BaseDocTemplate, Frame, PageTemplate
)
from reportlab.pdfgen import canvas as pdfcanvas
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY

W, H = A4

# ── Paleta ─────────────────────────────────────────────────────────────────
C_BG     = colors.HexColor("#0F1117")
C_CARD   = colors.HexColor("#14192A")
C_PURPLE = colors.HexColor("#7C5CFC")
C_BLUE   = colors.HexColor("#3B9BF5")
C_GREEN  = colors.HexColor("#10B981")
C_AMBER  = colors.HexColor("#F59E0B")
C_CORAL  = colors.HexColor("#E5725C")
C_WHITE  = colors.HexColor("#F1F5F9")
C_LIGHT  = colors.HexColor("#CBD5E1")
C_MUTED  = colors.HexColor("#64748B")
C_BORDER = colors.HexColor("#1E2A3A")

AGENT_COLORS = {
    "mediator":          colors.HexColor("#8B5CF6"),
    "psi-infantil":      colors.HexColor("#7C5CFC"),
    "psi-parentalidade": colors.HexColor("#E5725C"),
    "neuropsico":        colors.HexColor("#3B9BF5"),
    "neuropediatra":     colors.HexColor("#10B981"),
    "bcba":              colors.HexColor("#F59E0B"),
}
AGENT_NAMES = {
    "mediator":          "Coord. Atlas",
    "psi-infantil":      "Dra. Sofia Vygotski",
    "psi-parentalidade": "Dr. Victor Winnicott",
    "neuropsico":        "Dra. Helena Luria",
    "neuropediatra":     "Dr. Marco Cajal",
    "bcba":              "Dra. Íris Skinner",
}
AGENT_ROLES = {
    "mediator":          "Agente Mediador Central",
    "psi-infantil":      "Psicóloga Infantil",
    "psi-parentalidade": "Psicólogo — Parentalidade",
    "neuropsico":        "Neuropsicopediatra",
    "neuropediatra":     "Neuropediatra",
    "bcba":              "Analista do Comportamento — BCBA",
}
TYPE_LABELS = {
    "analysis": "ANÁLISE", "debate": "DEBATE",
    "summary": "SÍNTESE FINAL", "consensus": "CONSENSO",
    "question": "PERGUNTA", "response": "RESPOSTA",
}

def strip_md(text):
    """Remove markdown e limpa o texto para PDF."""
    text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)
    text = re.sub(r'\*(.+?)\*', r'\1', text)
    text = re.sub(r'#{1,6}\s*', '', text)
    text = re.sub(r'`(.+?)`', r'\1', text)
    return text.strip()

def md_to_para(text, style):
    """Converte markdown básico em Paragraph com XML do ReportLab."""
    text = text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    text = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', text)
    text = re.sub(r'\*(.+?)\*', r'<i>\1</i>', text)
    text = re.sub(r'`(.+?)`', r'<font name="Courier">\1</font>', text)
    return Paragraph(text, style)

# ── Estilos ─────────────────────────────────────────────────────────────────
def make_styles():
    return {
        "cover_title": ParagraphStyle("cover_title",
            fontName="Helvetica-Bold", fontSize=36, textColor=C_WHITE,
            leading=42, alignment=TA_CENTER, spaceAfter=6),
        "cover_sub": ParagraphStyle("cover_sub",
            fontName="Helvetica", fontSize=13, textColor=C_LIGHT,
            leading=18, alignment=TA_CENTER, spaceAfter=4),
        "cover_meta": ParagraphStyle("cover_meta",
            fontName="Helvetica", fontSize=10, textColor=C_MUTED,
            alignment=TA_CENTER, spaceAfter=2),
        "section_title": ParagraphStyle("section_title",
            fontName="Helvetica-Bold", fontSize=11, textColor=C_WHITE,
            leading=14, spaceAfter=6, spaceBefore=14,
            borderPad=6, leftIndent=0),
        "agent_name": ParagraphStyle("agent_name",
            fontName="Helvetica-Bold", fontSize=10, textColor=C_WHITE,
            leading=13, spaceAfter=1),
        "agent_role": ParagraphStyle("agent_role",
            fontName="Helvetica", fontSize=8, textColor=C_MUTED,
            leading=10, spaceAfter=4),
        "body": ParagraphStyle("body",
            fontName="Helvetica", fontSize=9, textColor=C_LIGHT,
            leading=14, spaceAfter=4, alignment=TA_JUSTIFY),
        "body_bold": ParagraphStyle("body_bold",
            fontName="Helvetica-Bold", fontSize=9, textColor=C_WHITE,
            leading=13, spaceAfter=3),
        "label": ParagraphStyle("label",
            fontName="Helvetica-Bold", fontSize=7, textColor=C_MUTED,
            leading=9, spaceAfter=3, spaceBefore=8),
        "badge": ParagraphStyle("badge",
            fontName="Helvetica-Bold", fontSize=7, textColor=C_WHITE,
            alignment=TA_CENTER),
        "disclaimer": ParagraphStyle("disclaimer",
            fontName="Helvetica", fontSize=8, textColor=C_AMBER,
            leading=12, alignment=TA_CENTER),
        "footer": ParagraphStyle("footer",
            fontName="Helvetica", fontSize=7, textColor=C_MUTED,
            alignment=TA_CENTER),
        "ref": ParagraphStyle("ref",
            fontName="Helvetica", fontSize=8, textColor=C_MUTED,
            leading=11, leftIndent=12, spaceAfter=2),
        "h3": ParagraphStyle("h3",
            fontName="Helvetica-Bold", fontSize=10, textColor=C_WHITE,
            leading=13, spaceAfter=3, spaceBefore=8),
        "h4": ParagraphStyle("h4",
            fontName="Helvetica-Bold", fontSize=8.5, textColor=C_LIGHT,
            leading=11, spaceAfter=2, spaceBefore=5),
        "bullet": ParagraphStyle("bullet",
            fontName="Helvetica", fontSize=9, textColor=C_LIGHT,
            leading=13, leftIndent=14, spaceAfter=2, bulletIndent=4),
    }

# ── Fundo escuro em cada página ─────────────────────────────────────────────
class DarkBackground:
    def __init__(self, title, child_name, date_str):
        self.title = title
        self.child_name = child_name
        self.date_str = date_str

    def __call__(self, canv, doc):
        canv.saveState()
        # Dark background
        canv.setFillColor(C_BG)
        canv.rect(0, 0, W, H, fill=1, stroke=0)
        # Subtle top gradient band
        canv.setFillColor(colors.HexColor("#0D1020"))
        canv.rect(0, H - 18*mm, W, 18*mm, fill=1, stroke=0)
        # Header line
        canv.setStrokeColor(C_PURPLE)
        canv.setLineWidth(2)
        canv.line(15*mm, H - 18*mm, W - 15*mm, H - 18*mm)
        # Header text
        canv.setFont("Helvetica-Bold", 8)
        canv.setFillColor(C_PURPLE)
        canv.drawString(15*mm, H - 13*mm, "MAnalista")
        canv.setFont("Helvetica", 7)
        canv.setFillColor(C_MUTED)
        canv.drawCentredString(W/2, H - 13*mm, f"Relatório de Análise Multiprofissional — {self.child_name}")
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

# ── Construção do conteúdo ──────────────────────────────────────────────────
def build_story(data, styles):
    S = styles
    story = []
    pt = data.get("lang", "pt") == "pt"
    child = data.get("childData", {})
    messages = data.get("messages", [])
    results = data.get("results", [])
    child_name = child.get("name", "—")
    age_y = child.get("ageYears", 0)
    age_m = child.get("ageMonths", 0)
    sex_map = {"M": "Masculino", "F": "Feminino", "outro": "Outro"}
    sex = sex_map.get(child.get("sex", "M"), "—")

    # ── COVER ────────────────────────────────────────────────────────────────
    story.append(Spacer(1, 40*mm))
    story.append(Paragraph("M<font color='#7C5CFC'>A</font>nalista", S["cover_title"]))
    story.append(Spacer(1, 2*mm))
    story.append(Paragraph("Relatório de Análise Multiprofissional Pediátrica", S["cover_sub"]))
    story.append(Spacer(1, 8*mm))

    # Info box
    cover_table = Table([
        [Paragraph("<b>Paciente</b>", S["badge"]),
         Paragraph("<b>Idade</b>", S["badge"]),
         Paragraph("<b>Sexo</b>", S["badge"]),
         Paragraph("<b>Data</b>", S["badge"])],
        [Paragraph(child_name, ParagraphStyle("cv", fontName="Helvetica-Bold", fontSize=11, textColor=C_WHITE, alignment=TA_CENTER)),
         Paragraph(f"{age_y}a {age_m}m", ParagraphStyle("cv2", fontName="Helvetica", fontSize=10, textColor=C_LIGHT, alignment=TA_CENTER)),
         Paragraph(sex, ParagraphStyle("cv3", fontName="Helvetica", fontSize=10, textColor=C_LIGHT, alignment=TA_CENTER)),
         Paragraph(datetime.now().strftime("%d/%m/%Y"), ParagraphStyle("cv4", fontName="Helvetica", fontSize=10, textColor=C_LIGHT, alignment=TA_CENTER))],
    ], colWidths=[40*mm, 30*mm, 35*mm, 40*mm])
    cover_table.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#1A2035")),
        ("BACKGROUND", (0,1), (-1,1), colors.HexColor("#141929")),
        ("ROUNDEDCORNERS", [4], ),
        ("BOX", (0,0), (-1,-1), 1, C_PURPLE),
        ("INNERGRID", (0,0), (-1,-1), 0.3, C_BORDER),
        ("TOPPADDING", (0,0), (-1,-1), 6),
        ("BOTTOMPADDING", (0,0), (-1,-1), 6),
        ("LEFTPADDING", (0,0), (-1,-1), 8),
        ("RIGHTPADDING", (0,0), (-1,-1), 8),
    ]))
    story.append(cover_table)
    story.append(Spacer(1, 8*mm))

    # Team listing
    team_data = [[
        Paragraph(f"<b>{AGENT_NAMES.get(aid,'')}</b><br/><font color='#64748B' size='7'>{AGENT_ROLES.get(aid,'')}</font>",
                  ParagraphStyle("tm", fontName="Helvetica", fontSize=8.5, textColor=C_WHITE, leading=12, alignment=TA_CENTER))
        for aid in ["mediator","psi-infantil","psi-parentalidade","neuropsico","neuropediatra","bcba"]
    ]]
    team_table = Table(team_data, colWidths=[28*mm]*6)
    team_table.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), colors.HexColor("#111827")),
        ("BOX", (0,0), (-1,-1), 0.5, C_BORDER),
        ("INNERGRID", (0,0), (-1,-1), 0.3, C_BORDER),
        ("TOPPADDING", (0,0), (-1,-1), 7),
        ("BOTTOMPADDING", (0,0), (-1,-1), 7),
        ("LEFTPADDING", (0,0), (-1,-1), 4),
        ("RIGHTPADDING", (0,0), (-1,-1), 4),
    ]))
    story.append(team_table)
    story.append(Spacer(1, 10*mm))
    story.append(Paragraph(
        "⚠  MODO DEMONSTRAÇÃO — Este relatório é uma sugestão hipotética sem validade diagnóstica real.",
        S["disclaimer"]))
    story.append(PageBreak())

    # ── ANÁLISES POR AGENTE ──────────────────────────────────────────────────
    # Group messages by agent
    agent_order = ["psi-infantil","psi-parentalidade","neuropsico","neuropediatra","bcba","mediator"]
    msg_by_agent: dict = {aid: [] for aid in agent_order}
    for msg in messages:
        aid = msg.get("agentId","")
        if aid in msg_by_agent:
            msg_by_agent[aid].append(msg)

    story.append(Paragraph("ANÁLISES DA EQUIPE", S["section_title"]))
    story.append(HRFlowable(width="100%", thickness=1, color=C_PURPLE, spaceAfter=6))

    for aid in agent_order:
        msgs = msg_by_agent[aid]
        if not msgs: continue
        ac = AGENT_COLORS.get(aid, C_BLUE)
        name = AGENT_NAMES.get(aid, aid)
        role = AGENT_ROLES.get(aid, "")

        # Agent header row
        agent_header = Table([[
            Paragraph(f"<b>{name}</b>", ParagraphStyle("ah", fontName="Helvetica-Bold", fontSize=10, textColor=C_WHITE)),
            Paragraph(role, ParagraphStyle("ar", fontName="Helvetica", fontSize=8, textColor=colors.HexColor('#%02x%02x%02x' % (int(ac.red*255), int(ac.green*255), int(ac.blue*255))) if hasattr(ac, 'red') else colors.HexColor("#94A3B8"))),
        ]], colWidths=[80*mm, None])
        agent_header.setStyle(TableStyle([
            ("BACKGROUND", (0,0), (-1,-1), colors.HexColor("#111827")),
            ("LINEBELOW", (0,0), (-1,0), 2, ac),
            ("TOPPADDING", (0,0), (-1,-1), 7),
            ("BOTTOMPADDING", (0,0), (-1,-1), 7),
            ("LEFTPADDING", (0,0), (-1,-1), 8),
            ("RIGHTPADDING", (0,0), (-1,-1), 8),
            ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
        ]))
        story.append(KeepTogether([agent_header]))
        story.append(Spacer(1, 2*mm))

        for msg in msgs:
            label = TYPE_LABELS.get(msg.get("type",""), msg.get("type","").upper())
            story.append(Paragraph(label, S["label"]))
            content = msg.get("content","")
            story.extend(render_content_lines(content, styles, ac))
            story.append(Spacer(1, 3*mm))

        story.append(HRFlowable(width="100%", thickness=0.3, color=C_BORDER, spaceAfter=4))

    # ── RESULTADO DIAGNÓSTICO ────────────────────────────────────────────────
    if results:
        story.append(PageBreak())
        story.append(Paragraph("SUGESTÃO DIAGNÓSTICA", S["section_title"]))
        story.append(HRFlowable(width="100%", thickness=1, color=C_BLUE, spaceAfter=8))

        for i, res in enumerate(results):
            path = res.get("primaryPathology","")
            icd = res.get("icd11Code","")
            dsm = res.get("dsm5Code","")
            conf = res.get("confidence","moderada")
            conf_colors = {"alta": C_GREEN, "moderada": C_AMBER, "baixa": C_CORAL}
            conf_labels = {"alta":"Alta","moderada":"Moderada","baixa":"Baixa"}
            conf_pct    = {"alta":90,"moderada":60,"baixa":35}
            cc = conf_colors.get(conf, C_AMBER)
            pct = conf_pct.get(conf, 60)

            # Pathology header
            path_table = Table([[
                Paragraph(f"<b>{i+1}. {path}</b>",
                          ParagraphStyle("ph", fontName="Helvetica-Bold", fontSize=12, textColor=C_WHITE, leading=15)),
            ]], colWidths=[None])
            path_table.setStyle(TableStyle([
                ("BACKGROUND", (0,0), (-1,-1), colors.HexColor("#0D1526")),
                ("LINEBELOW", (0,0), (-1,0), 2, C_BLUE),
                ("TOPPADDING", (0,0), (-1,-1), 10),
                ("BOTTOMPADDING", (0,0), (-1,-1), 10),
                ("LEFTPADDING", (0,0), (-1,-1), 10),
            ]))
            story.append(path_table)
            story.append(Spacer(1, 3*mm))

            # Code + confidence row
            codes_table = Table([[
                Paragraph(f"<b>CID-11:</b> {icd}", ParagraphStyle("code", fontName="Helvetica", fontSize=9, textColor=C_BLUE)),
                Paragraph(f"<b>DSM-5:</b> {dsm}", ParagraphStyle("code2", fontName="Helvetica", fontSize=9, textColor=C_PURPLE)),
                Paragraph(f"<b>Confiança:</b> {conf_labels.get(conf,'')} ({pct}%)",
                          ParagraphStyle("conf", fontName="Helvetica-Bold", fontSize=9, textColor=cc)),
            ]], colWidths=[55*mm, 55*mm, None])
            codes_table.setStyle(TableStyle([
                ("TOPPADDING", (0,0), (-1,-1), 4),
                ("BOTTOMPADDING", (0,0), (-1,-1), 4),
                ("LEFTPADDING", (0,0), (-1,-1), 0),
            ]))
            story.append(codes_table)
            story.append(Spacer(1, 4*mm))

            # Treatment suggestions
            treatments = res.get("treatmentSuggestions", [])
            if treatments:
                story.append(Paragraph("SUGESTÕES DE TRATAMENTO", S["label"]))
                ev_colors = {"A": C_GREEN, "B": C_AMBER, "C": C_CORAL}
                for t in treatments:
                    ev = t.get("evidenceLevel","B")
                    evc = ev_colors.get(ev, C_AMBER)
                    t_table = Table([[
                        Paragraph(f"<b>{ev}</b>",
                                  ParagraphStyle("ev", fontName="Helvetica-Bold", fontSize=8,
                                                 textColor=evc, alignment=TA_CENTER)),
                        [Paragraph(f"<b>{t.get('modality','')}</b>", S["body_bold"]),
                         Paragraph(t.get("description",""), S["body"])],
                    ]], colWidths=[10*mm, None])
                    t_table.setStyle(TableStyle([
                        ("BACKGROUND", (0,0), (0,0), colors.HexColor("#111827")),
                        ("BOX", (0,0), (-1,-1), 0.5, C_BORDER),
                        ("VALIGN", (0,0), (-1,-1), "TOP"),
                        ("TOPPADDING", (0,0), (-1,-1), 5),
                        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
                        ("LEFTPADDING", (0,0), (-1,-1), 5),
                        ("RIGHTPADDING", (0,0), (-1,-1), 5),
                    ]))
                    story.append(t_table)
                    story.append(Spacer(1, 2*mm))

            # Scientific refs
            refs = res.get("scientificRefs", [])
            if refs:
                story.append(Spacer(1, 4*mm))
                story.append(Paragraph("REFERÊNCIAS CIENTÍFICAS", S["label"]))
                for j, ref in enumerate(refs):
                    story.append(Paragraph(
                        f"[{j+1}] {ref.get('authors','')} ({ref.get('year','')}). "
                        f"<i>{ref.get('title','')}</i>. {ref.get('journal','')}"
                        + (f". DOI: {ref['doi']}" if ref.get('doi') else "") + ".",
                        S["ref"]))

    # ── DISCLAIMER FINAL ────────────────────────────────────────────────────
    story.append(Spacer(1, 10*mm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=C_BORDER, spaceAfter=6))
    story.append(Paragraph(
        "Este relatório foi gerado por agentes de IA em modo demonstração. "
        "Não constitui diagnóstico médico real, não tem validade clínica e "
        "não substitui avaliação presencial por profissional de saúde habilitado. "
        "Os personagens representados são fictícios.",
        S["disclaimer"]))
    return story

def render_content_lines(text, styles, agent_color):
    """Renderiza o conteúdo markdown em paragrafos ReportLab."""
    S = styles
    elements = []
    lines = text.split("\n")
    list_items = []

    def flush_list():
        for item in list_items:
            item_text = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', item.replace('&','&amp;').replace('<','&lt;').replace('>','&gt;'))
            elements.append(Paragraph(f"• {item_text}", S["bullet"]))
        list_items.clear()

    for raw in lines:
        line = raw.rstrip()
        if not line.strip():
            flush_list()
            elements.append(Spacer(1, 2*mm))
            continue
        if re.match(r'^---+$', line.strip()):
            flush_list()
            elements.append(HRFlowable(width="100%", thickness=0.3, color=colors.HexColor("#1E2A3A"), spaceAfter=2))
            continue
        if line.startswith("#### "):
            flush_list()
            txt = line[5:].replace('&','&amp;').replace('<','&lt;').replace('>','&gt;')
            txt = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', txt)
            elements.append(Paragraph(txt, S["h4"]))
            continue
        if line.startswith("### "):
            flush_list()
            txt = line[4:].replace('&','&amp;').replace('<','&lt;').replace('>','&gt;')
            txt = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', txt)
            elements.append(Paragraph(txt, S["h3"]))
            continue
        if line.startswith("## "):
            flush_list()
            txt = line[3:].replace('&','&amp;').replace('<','&lt;').replace('>','&gt;')
            elements.append(Paragraph(f"<b>{txt}</b>", S["h3"]))
            continue
        if re.match(r'^[-•]\s', line):
            list_items.append(line[2:])
            continue
        flush_list()
        txt = line.replace('&','&amp;').replace('<','&lt;').replace('>','&gt;')
        txt = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', txt)
        txt = re.sub(r'\*(.+?)\*', r'<i>\1</i>', txt)
        elements.append(Paragraph(txt, S["body"]))

    flush_list()
    return elements

def generate(input_path, output_path):
    with open(input_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    child_name = data.get("childData", {}).get("name", "Paciente")
    date_str = datetime.now().strftime("%d/%m/%Y %H:%M")

    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=15*mm, rightMargin=15*mm,
        topMargin=22*mm, bottomMargin=20*mm,
        title=f"MAnalista — Relatório de {child_name}",
        author="MAnalista AI",
        subject="Análise Multiprofissional Pediátrica",
    )

    bg = DarkBackground("MAnalista", child_name, date_str)
    styles = make_styles()
    story = build_story(data, styles)
    doc.build(story, onFirstPage=bg, onLaterPages=bg)
    print(f"PDF gerado: {output_path}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Uso: python3 generate_pdf.py <input.json> <output.pdf>")
        sys.exit(1)
    generate(sys.argv[1], sys.argv[2])
