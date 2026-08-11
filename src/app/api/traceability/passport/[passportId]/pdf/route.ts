import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

const BRAND_GREEN = rgb(0.08, 0.45, 0.22)
const DARK = rgb(0.15, 0.15, 0.15)
const MUTED = rgb(0.4, 0.4, 0.4)
const LIGHT = rgb(0.9, 0.92, 0.9)

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 3)}...` : text
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ passportId: string }> },
) {
  try {
    const { passportId } = await params

    const passport = await db.farmPassport.findFirst({
      where: { passportId, isActive: true },
    })

    if (!passport) {
      return NextResponse.json({ error: 'Passport not found or inactive' }, { status: 404 })
    }

    const data = JSON.parse(passport.passportData) as {
      farmer?: { name?: string; code?: string; phone?: string; gender?: string }
      organization?: { name?: string; country?: string; type?: string }
      farms?: Array<{ name?: string; sizeHectares?: number | null; crops?: string }>
      certifications?: {
        eudr?: Array<{ plotName?: string; status?: string; expiryDate?: string | null }>
        rainforestAlliance?: Array<{ certificateNo?: string; level?: string; expiryDate?: string | null }>
        globalGap?: Array<{ certificateNo?: string; scope?: string; expiryDate?: string | null }>
      }
      recentBatches?: Array<{ batchId?: string; commodity?: string; quantityKg?: number; status?: string }>
      issuedCount?: number
    }

    const pdf = await PDFDocument.create()
    const page = pdf.addPage([595, 842]) // A4 portrait

    const font = await pdf.embedFont(StandardFonts.Helvetica)
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
    const { height, width } = page.getSize()

    const leftMargin = 40
    const sectionGap = 34
    let y = height - 140

    const drawSectionTitle = (title: string) => {
      y -= 22
      page.drawRectangle({ x: leftMargin, y, width: 180, height: 18, color: LIGHT })
      page.drawText(title.toUpperCase(), {
        x: leftMargin + 6,
        y: y + 4,
        size: 10,
        font: bold,
        color: BRAND_GREEN,
      })
      y -= 20
    }

    const drawLine = (label: string, value: string) => {
      page.drawText(label, { x: leftMargin, y, size: 10, font, color: MUTED })
      page.drawText(truncate(value, 70), { x: leftMargin + 180, y, size: 10, font: bold, color: DARK })
      y -= 16
    }

    // Header band
    page.drawRectangle({ x: 0, y: height - 110, width, height: 110, color: BRAND_GREEN })
    page.drawText('AGROBASE FARM PASSPORT', {
      x: leftMargin,
      y: height - 55,
      size: 22,
      font: bold,
      color: rgb(1, 1, 1),
    })
    page.drawText(`Passport ID: ${passportId}`, {
      x: leftMargin,
      y: height - 82,
      size: 12,
      font,
      color: rgb(0.9, 1, 0.9),
    })
    page.drawText(`Issued: ${passport.generatedAt.toISOString().split('T')[0]}`, {
      x: width - 200,
      y: height - 82,
      size: 10,
      font,
      color: rgb(0.9, 1, 0.9),
    })

    // Farmer section
    drawSectionTitle('Farmer')
    const farmer = data.farmer ?? {}
    drawLine('Name', farmer.name ?? '-')
    drawLine('Farmer Code', farmer.code ?? '-')
    drawLine('Phone', farmer.phone ?? '-')
    drawLine('Gender', farmer.gender ?? '-')
    y -= sectionGap

    // Organization
    drawSectionTitle('Organization')
    const org = data.organization ?? {}
    drawLine('Name', org.name ?? '-')
    drawLine('Country', org.country ?? '-')
    drawLine('Type', org.type ?? '-')
    y -= sectionGap

    // Farms
    drawSectionTitle('Farms')
    const farms = data.farms ?? []
    if (farms.length > 0) {
      drawLine('Name', `${farms.length} plot(s)`)
      drawLine('Size (ha)', farms.reduce((s, f) => s + (f.sizeHectares ?? 0), 0).toString())
      const crops = [...new Set(farms.flatMap((f) => f.crops ?? []))].join(', ') || 'Not specified'
      drawLine('Crops', crops)
    } else {
      page.drawText('No farm plots registered', { x: leftMargin, y, size: 10, font, color: MUTED })
      y -= 16
    }
    y -= sectionGap

    // Certifications
    drawSectionTitle('Certifications')
    const certs = data.certifications ?? {}
    const eudr = certs.eudr ?? []
    const ra = certs.rainforestAlliance ?? []
    const gap = certs.globalGap ?? []
    drawLine('EUDR Compliance', eudr.length ? `${eudr.length} verified plot(s)` : 'None')
    drawLine('Rainforest Alliance', ra.length > 0 ? `Verified · ${ra[0].certificateNo ?? ''}` : 'None')
    drawLine('GLOBALG.A.P.', gap.length > 0 ? `Verified · ${gap[0].certificateNo ?? ''}` : 'None')
    y -= sectionGap

    // Recent batches
    drawSectionTitle('Recent Batches')
    const batches = data.recentBatches ?? []
    if (batches.length > 0) {
      for (const b of batches.slice(0, 5)) {
        drawLine(`${b.commodity ?? 'Commodity'} (${b.batchId ?? ''})`, `${b.quantityKg ?? 0}kg · ${b.status ?? '-'}`)
      }
    } else {
      page.drawText('No batches recorded', { x: leftMargin, y, size: 10, font, color: MUTED })
      y -= 16
    }

    // Footer
    page.drawRectangle({ x: 0, y: 0, width, height: 40, color: BRAND_GREEN })
    page.drawText(`Issue #${data.issuedCount ?? 1}  ·  Verify at /verify/${passportId}`, {
      x: leftMargin,
      y: 14,
      size: 9,
      font,
      color: rgb(1, 1, 1),
    })

    const pdfBytes = await pdf.save()
    return new NextResponse(new Uint8Array(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="farm-passport-${passportId}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Passport PDF error:', error)
    return NextResponse.json({ error: 'Failed to generate passport PDF' }, { status: 500 })
  }
}