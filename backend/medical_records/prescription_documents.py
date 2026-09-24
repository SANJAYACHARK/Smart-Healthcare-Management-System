import hashlib, hmac
from io import BytesIO
import qrcode
from django.conf import settings
from django.http import HttpResponse
from django.urls import reverse
from django.utils import timezone
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import Image, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

def prescription_signature(prescription_id):
    return hmac.new(settings.SECRET_KEY.encode(), str(prescription_id).encode(), hashlib.sha256).hexdigest()[:40]

def verify_prescription_signature(prescription_id, signature):
    return hmac.compare_digest(prescription_signature(prescription_id), signature or "")

def verification_url(request, prescription):
    path=reverse("prescription-public-verify", kwargs={"prescription_id":prescription.id,"signature":prescription_signature(prescription.id)})
    return request.build_absolute_uri(path)

def _name(user):
    return (user.get_full_name() or "").strip() or user.username

def build_prescription_pdf(request, prescription):
    buffer=BytesIO()
    doc=SimpleDocTemplate(buffer,pagesize=A4,rightMargin=16*mm,leftMargin=16*mm,topMargin=14*mm,bottomMargin=14*mm,
                          title=f"SmartCare Prescription RX-{prescription.id:06d}")
    styles=getSampleStyleSheet()
    title=ParagraphStyle("t",parent=styles["Title"],fontSize=22,textColor=colors.HexColor("#970747"),spaceAfter=3)
    sub=ParagraphStyle("s",parent=styles["Normal"],fontSize=8.5,textColor=colors.HexColor("#57534E"))
    sec=ParagraphStyle("h",parent=styles["Heading2"],fontSize=12,textColor=colors.HexColor("#970747"),spaceBefore=10,spaceAfter=6)
    body=ParagraphStyle("b",parent=styles["BodyText"],fontSize=9,leading=13)
    record=prescription.medical_record
    issued=timezone.localtime(prescription.created_at).strftime("%d %b %Y, %I:%M %p")
    verify=verification_url(request,prescription)
    qr=qrcode.make(verify); qrb=BytesIO(); qr.save(qrb,format="PNG"); qrb.seek(0)
    story=[Paragraph("SmartCare",title),Paragraph("DIGITAL MEDICAL PRESCRIPTION",sub),Spacer(1,6*mm)]
    info=[["Prescription",f"RX-{prescription.id:06d}","Issued",issued],
          ["Patient",_name(prescription.patient),"Doctor",f"Dr. {_name(prescription.doctor.user)}"],
          ["Diagnosis",record.diagnosis,"Follow-up",str(record.follow_up_date or "Not scheduled")]]
    t=Table(info,colWidths=[27*mm,57*mm,25*mm,57*mm])
    t.setStyle(TableStyle([("BACKGROUND",(0,0),(0,-1),colors.HexColor("#F5F4F0")),("BACKGROUND",(2,0),(2,-1),colors.HexColor("#F5F4F0")),
      ("FONTNAME",(0,0),(0,-1),"Helvetica-Bold"),("FONTNAME",(2,0),(2,-1),"Helvetica-Bold"),("FONTSIZE",(0,0),(-1,-1),8),
      ("GRID",(0,0),(-1,-1),.35,colors.HexColor("#E7E5E0")),("VALIGN",(0,0),(-1,-1),"TOP"),("PADDING",(0,0),(-1,-1),6)]))
    story += [t,Paragraph("Medicines",sec)]
    rows=[["Medicine","Dosage","Frequency","Duration","Food / Notes"]]
    for m in prescription.medicines.all():
        extra=" / ".join(x for x in [m.food_instruction,m.notes] if x)
        rows.append([m.medicine_name,m.dosage,m.frequency,m.duration,extra or "-"])
    mt=Table(rows,repeatRows=1,colWidths=[38*mm,26*mm,31*mm,25*mm,46*mm])
    mt.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,0),colors.HexColor("#1C1917")),("TEXTCOLOR",(0,0),(-1,0),colors.white),
      ("FONTNAME",(0,0),(-1,0),"Helvetica-Bold"),("FONTSIZE",(0,0),(-1,-1),7.5),("GRID",(0,0),(-1,-1),.35,colors.HexColor("#E7E5E0")),
      ("VALIGN",(0,0),(-1,-1),"TOP"),("PADDING",(0,0),(-1,-1),6)]))
    story.append(mt)
    if prescription.advice: story += [Paragraph("Doctor's Advice",sec),Paragraph(prescription.advice,body)]
    story += [Spacer(1,6*mm),Paragraph("Authenticity Verification",sec)]
    vt=Table([[Image(qrb,width=30*mm,height=30*mm),Paragraph("<b>Scan this QR code to verify this prescription.</b><br/><br/>The signed verification page confirms the prescription reference, patient, doctor and issue date.",body)]],colWidths=[36*mm,130*mm])
    vt.setStyle(TableStyle([("VALIGN",(0,0),(-1,-1),"MIDDLE"),("BOX",(0,0),(-1,-1),.5,colors.HexColor("#E7E5E0")),("BACKGROUND",(0,0),(-1,-1),colors.HexColor("#FDFBFC")),("PADDING",(0,0),(-1,-1),8)]))
    story += [vt,Spacer(1,3*mm),Paragraph(verify,sub)]
    doc.build(story); buffer.seek(0)
    response=HttpResponse(buffer.getvalue(),content_type="application/pdf")
    response["Content-Disposition"]=f'attachment; filename="SmartCare_Prescription_RX-{prescription.id:06d}.pdf"'
    return response
