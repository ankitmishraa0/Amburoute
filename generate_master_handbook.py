"""
AmbuRoute Complete Project Master Report & Viva Voce Handbook Generator
Comprehensive bilingual (English + Hinglish) publication-grade PDF and HTML document.
"""

import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)

def build_pdf(filename="AmbuRoute_Complete_Project_Handbook.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    
    styles = getSampleStyleSheet()
    
    C_PRIMARY = colors.HexColor("#E11D48")      # Emergency Crimson Red
    C_SECONDARY = colors.HexColor("#0F172A")    # Dark Slate
    C_MUTED = colors.HexColor("#475569")        # Muted Slate
    C_ACCENT_BG = colors.HexColor("#FFF1F2")    # Light Rose BG
    C_CARD_BG = colors.HexColor("#F8FAFC")      # Slate 50 BG
    C_BORDER = colors.HexColor("#CBD5E1")       # Slate Border
    C_EMERALD = colors.HexColor("#059669")     # Green Wave
    C_AMBER = colors.HexColor("#D97706")       # Amber
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=C_PRIMARY,
        spaceAfter=4
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=15,
        textColor=C_MUTED,
        spaceAfter=12
    )

    h1_style = ParagraphStyle(
        'SectionH1',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=C_PRIMARY,
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'SectionH2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=C_SECONDARY,
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=C_SECONDARY,
        spaceAfter=4
    )

    body_hinglish = ParagraphStyle(
        'HinglishStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8.5,
        leading=12.5,
        textColor=colors.HexColor("#1E293B"),
        spaceAfter=5
    )

    code_style = ParagraphStyle(
        'CodeSnippet',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8,
        leading=10.5,
        textColor=colors.HexColor("#9F1239"),
        backColor=colors.HexColor("#FFF1F2"),
        spaceAfter=4
    )

    story = []

    # ================= HEADER / TITLE =================
    story.append(Paragraph("AMBUROUTE: SMART EMERGENCY DISASTER RESPONSE OS", title_style))
    story.append(Paragraph("Complete Engineering Report, Architectural Specifications, Technology Stack & Master Viva Handbook", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=2, color=C_PRIMARY, spaceBefore=0, spaceAfter=10))

    # ================= 1. EXECUTIVE SUMMARY =================
    story.append(Paragraph("1. Executive Summary & Problem Statement", h1_style))
    story.append(Paragraph(
        "<b>English:</b> In urban environments, ambulances face severe delays due to traffic gridlock, manual signal halts, and lack of pre-arrival ER coordination. The 'Golden Hour' (first 60 minutes) is critical in trauma and cardiac cases. <b>AmbuRoute</b> is an end-to-end intelligent IoT mission operating system featuring automated V2I (Vehicle-to-Infrastructure) traffic light preemption ('Green Wave'), real-time clinical triage, multi-criteria hospital matching, and bidirectional pre-arrival ER telemetry.",
        body_style
    ))
    story.append(Paragraph(
        "<b>Hinglish Explanation:</b> Real world me ambulance ko traffic jam aur red signals ki wajah se hospital pahunchne me bahut der ho jaati hai, jisse patient ki jaan ja sakti hai. Is project (AmbuRoute) ka main goal hai ambulance ke raste ke saare signals ko IoT se automatically GREEN karna, patient ke vitals hospital ER ko advance me bhej kar bed reserve karwana, aur sabse best hospital select karna.",
        body_hinglish
    ))
    story.append(Spacer(1, 8))

    # ================= 2. TECHNOLOGIES USED =================
    story.append(Paragraph("2. Complete Technology Stack (A to Z Breakdown)", h1_style))
    
    tech_data = [
        ["Layer / Module", "Technology Used", "Role & Practical Justification"],
        ["Frontend UI", "React 19, Vite", "High-performance Single Page Application with sub-second hot reload and zero rendering lag."],
        ["Styling System", "Tailwind CSS + Vanilla CSS", "Ultra-clean Red & White Emergency theme + Tactical Dark Mission mode with responsive glass panels."],
        ["Mapping & GIS", "Leaflet.js + OpenStreetMap / Esri", "Zero-cost open mapping with custom DivIcon markers, animated radar pulses, and corridor polylines."],
        ["Backend Server", "FastAPI (Python 3.11), Uvicorn", "High-throughput asynchronous ASGI microservice with native Pydantic data validation."],
        ["Real-Time Duplex", "WebSockets (FastAPI Pub/Sub)", "Continuous 10 Hz bidirectional telemetry push between ambulance MDT, hospital desk, and traffic signals."],
        ["Audio Engine", "Web Audio API (Synthesizer)", "Pure browser-native sound generation for sirens, clicks, and green-wave pings (zero audio file dependencies)."],
        ["Routing Engine", "Haversine Geodesic Math + Graph", "Accurate distance calculation, waypoint interpolation, and dynamic intersection proximity detection."],
        ["Decision Matrix", "TOPSIS / Multi-Criteria Scoring", "Weighted AI ranking: Distance (30%) + Bed Vacancy (30%) + Cath Lab (25%) + ER Wait (15%)."],
        ["Triage AI", "Rule-Based Clinical Risk Model", "Real-time hemodynamic instability scoring, Shock Index, and Killip Class categorization."]
    ]
    
    t_tech = Table(tech_data, colWidths=[100, 150, 290])
    t_tech.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), C_PRIMARY),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 8.5),
        ('BOTTOMPADDING', (0,0), (-1,0), 5),
        ('TOPPADDING', (0,0), (-1,0), 5),
        ('BACKGROUND', (0,1), (-1,-1), C_CARD_BG),
        ('GRID', (0,0), (-1,-1), 0.5, C_BORDER),
        ('FONTNAME', (0,1), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,1), (-1,-1), 8),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, C_CARD_BG])
    ]))
    story.append(t_tech)
    story.append(Spacer(1, 10))

    # ================= 3. SYSTEM ARCHITECTURE =================
    story.append(Paragraph("3. System Architecture & Operational Workstations", h1_style))
    story.append(Paragraph(
        "<b>English:</b> The system employs a modern <b>Role-Based Access Control (RBAC)</b> architecture with 4 distinct operational portals:",
        body_style
    ))
    
    roles_data = [
        ["Role Portal", "Default Credentials", "Operational Workstation & Capabilities"],
        ["🚑 Ambulance Driver / Paramedic", "driver108 / 1080", "Live GPS turn-by-turn navigation, dynamic hospital selector, real-time vitals entry, and siren control."],
        ["🏥 Hospital ER Doctor / Staff", "doctor_aiims / aiims123", "Pre-arrival trauma bay reception, real-time Lead-II ECG waveform monitor, ICU bed reservation, and clinical prep."],
        ["🚦 Traffic Police Controller", "traffic_gkp / traffic123", "Physical 3-aspect traffic light console (Red/Amber/Green), Master Green Wave override, and corridor tracking."],
        ["👑 Super Administrator (God Mode)", "admin / admin123", "Full root authority: Speed slider (0-120 km/h), patient vitals injector, signal override, hospital bed capacity editor."]
    ]
    
    t_roles = Table(roles_data, colWidths=[130, 110, 300])
    t_roles.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), C_SECONDARY),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 8.5),
        ('BACKGROUND', (0,1), (-1,-1), colors.white),
        ('GRID', (0,0), (-1,-1), 0.5, C_BORDER),
        ('FONTNAME', (0,1), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,1), (-1,-1), 8),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [C_CARD_BG, colors.white])
    ]))
    story.append(t_roles)
    story.append(Spacer(1, 8))

    story.append(Paragraph(
        "<b>Hinglish Explanation:</b> Examiner agar pooche ki 4 log kaise kaam karte hain: Ambulance Driver raste aur patient par dhyan deta hai, Hospital Doctor aane wale mareez ke liye ICU bed arrange karta hai, Traffic Police signals control karti hai, aur Administrator project me koi bhi value live change kar sakta hai.",
        body_hinglish
    ))
    story.append(Spacer(1, 10))

    # ================= 4. WORKING & DATA FLOW =================
    story.append(Paragraph("4. Step-by-Step Project Working (Data Flow)", h1_style))
    workflow_steps = [
        "<b>Step 1 (Incident Dispatch):</b> 108 CAD operator inputs or receives emergency call (e.g. STEMI, Poly-Trauma, Pediatric Sepsis). Ambulance MEDIC-12 is mobilized.",
        "<b>Step 2 (Hospital Recommendation):</b> System runs TOPSIS AI matrix comparing AIIMS, BRD Medical, and Fatima Hospital based on ICU beds, travel time, and cath-lab capability.",
        "<b>Step 3 (V2I Traffic Preemption):</b> As ambulance drives, GPS telemetry triggers optical/radio preemption handshakes 500m ahead, changing intersections to Green Wave.",
        "<b>Step 4 (ER Telemetry & Bed Reservation):</b> Paramedics enter live vitals (HR, BP, SpO2) which stream to Hospital ER Trauma Desk via WebSockets, allowing doctors to reserve ICU beds before arrival."
    ]
    for step in workflow_steps:
        story.append(Paragraph(f"• {step}", body_style))
    story.append(Spacer(1, 10))

    # ================= 5. VIVA QUESTIONS & ANSWERS =================
    story.append(PageBreak())
    story.append(Paragraph("5. Master Viva Voce Q&A Handbook (English + Hinglish)", h1_style))
    story.append(Paragraph("Prepare these high-frequency questions to excel in your final year project presentation:", subtitle_style))

    viva_qa = [
        (
            "Q1: What is the main innovation of AmbuRoute compared to Google Maps?",
            "Google Maps provides static navigation for general public but cannot communicate with traffic lights or transmit medical telemetry to hospitals. AmbuRoute actively preempts traffic signals (Green Wave) via V2I protocols and transmits pre-arrival clinical vitals to the ER bay.",
            "Google Maps sirf rasta batata hai, par AmbuRoute traffic signals ko automatically GREEN karta hai aur hospital me doctor ko mareez ke live vitals bhejta hai taaki bed pehle se ready rahe."
        ),
        (
            "Q2: How does the V2I Traffic Signal Preemption work technically?",
            "The ambulance broadcasts its GPS coordinates and heading at 10 Hz over 5G C-V2X / DSRC. When within the 500m geofence buffer of an intersection, the controller calculates ETA and initiates cross-traffic yellow clearance, holding green priority until the ambulance clears.",
            "Ambulance jab kisi signal se 500 meter door hoti hai, to system C-V2X IoT handshake bhejta hai. Signal cross-traffic ko rokk kar ambulance ke liye green wave chalu kar deta hai."
        ),
        (
            "Q3: How does the Hospital Matrix decide which hospital to select?",
            "It utilizes a Multi-Criteria Decision Making (MCDM) weighted TOPSIS algorithm: Travel Distance (30%), Bed Availability (30%), Cath Lab / Trauma Level (25%), and ER Wait Efficiency (15%).",
            "Ye algorithm sirf doori nahi dekhta; ye dekhta hai ki kis hospital me ICU bed khali hai aur specific specialist doctor (jaise Cath Lab) available hai ya nahi."
        ),
        (
            "Q4: Why did you use WebSockets instead of normal HTTP REST APIs?",
            "REST APIs require polling (request/response overhead) with 1-2 second latency. WebSockets maintain a persistent, full-duplex TCP socket, enabling real-time telemetry streaming at under 15ms latency.",
            "HTTP me har baar request bhejni padti hai jisse delay hota hai. WebSocket se continuous direct connection rehta hai, jisse ambulance ki speed aur ECG bina rukavat hospital screen par dikhti hai."
        ),
        (
            "Q5: What is the role of the Super Administrator deck?",
            "It provides God-Mode authority for demonstration and administrative testing: live speed adjustment, patient vital injection, full corridor green wave override, hospital bed modification, and traffic jam simulation.",
            "Administrator panel se project ki kisi bhi value (speed, BP, heart rate, signals, beds) ko examiner ke samne live change karke dikhaya ja sakta hai."
        ),
        (
            "Q6: How is patient triage calculated in the AI Clinical module?",
            "The model computes the Shock Index (HR / Systolic BP), GCS neurological coma score, and oxygen desaturation to stratify patients into Immediate (Red), Urgent (Yellow), or Delayed (Green).",
            "System Heart Rate aur Blood Pressure ka ratio nikaalta hai (Shock Index) aur GCS score check karke patient ko critical red ya yellow tag deta hai."
        ),
        (
            "Q7: How are audio sirens generated without audio files?",
            "Through the HTML5 Web Audio API, which synthesizes sound waves (sine, square, and triangle oscillators) directly on the client CPU, resulting in zero network bandwidth and zero audio file dependencies.",
            "Web Audio API browser ke andar mathematical frequency banakar siren aur clicks bajati hai, jisse koi mp3 file download karne ki zaroorat nahi padti."
        ),
        (
            "Q8: What happens if a traffic signal fails to connect to IoT?",
            "The system defaults to fail-safe mode: it alerts the ambulance of the connection failure, highlights the intersection in red on the GIS map, and allows the traffic police officer to execute a manual override.",
            "Agar IoT signal disconnect ho jaye, to system map par alert dikhata hai aur Traffic Police desk par manual switch button enable kar deta hai."
        )
    ]

    for q, ans_en, ans_hi in viva_qa:
        story.append(Paragraph(f"<b>{q}</b>", h2_style))
        story.append(Paragraph(f"<b>Technical Answer (EN):</b> {ans_en}", body_style))
        story.append(Paragraph(f"<b>Aasan Bhasha Me (Hinglish):</b> {ans_hi}", body_hinglish))
        story.append(Spacer(1, 4))

    # ================= 6. GIT & FREE DEPLOYMENT =================
    story.append(PageBreak())
    story.append(Paragraph("6. Git Push & 100% Free Deployment Guide", h1_style))
    story.append(Paragraph("Follow these exact steps to push code to GitHub and host live for free:", subtitle_style))

    story.append(Paragraph("<b>Step A: Push Project to Your GitHub</b>", h2_style))
    git_cmds = (
        "git init<br/>"
        "git add .<br/>"
        "git commit -m \"feat: Complete AmbuRoute Emergency OS with Role Portals & Admin Deck\"<br/>"
        "git branch -M main<br/>"
        "git remote add origin https://github.com/YOUR_USERNAME/amburoute.git<br/>"
        "git push -u origin main"
    )
    story.append(Paragraph(git_cmds, code_style))
    story.append(Spacer(1, 6))

    story.append(Paragraph("<b>Step B: Deploy Frontend (Vercel - 100% Free)</b>", h2_style))
    story.append(Paragraph(
        "1. Open <b>vercel.com</b> and sign in with GitHub.<br/>"
        "2. Click <b>Add New Project</b> and import your <b>amburoute</b> repository.<br/>"
        "3. Set Root Directory to <b>frontend</b>.<br/>"
        "4. Click <b>Deploy</b>. Your frontend will be live in 60 seconds with a free `.vercel.app` HTTPS domain!",
        body_style
    ))
    story.append(Spacer(1, 6))

    story.append(Paragraph("<b>Step C: Deploy Backend (Render.com - 100% Free)</b>", h2_style))
    story.append(Paragraph(
        "1. Open <b>render.com</b> and create a free account.<br/>"
        "2. Click <b>New +</b> -> <b>Web Service</b> -> Connect GitHub repository.<br/>"
        "3. Set Root Directory to <b>backend</b>.<br/>"
        "4. Build Command: <code>pip install -r requirements.txt</code><br/>"
        "5. Start Command: <code>uvicorn app.main:app --host 0.0.0.0 --port $PORT</code><br/>"
        "6. Click <b>Create Web Service</b>. Backend API and WebSockets are live!",
        body_style
    ))

    doc.build(story)
    print(f"PDF Successfully generated at: {filename}")

if __name__ == "__main__":
    build_pdf()
