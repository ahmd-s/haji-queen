import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

/**
 * Custom measurement inquiries.
 * These are booking REQUESTS — never presented as confirmed appointments.
 * Data is stored for admin review only.
 */
const schema = z.object({
  fullName: z.string().trim().min(2).max(80),
  phone: z.string().trim().regex(/^[+0-9][0-9\s-]{7,15}$/),
  email: z.string().trim().email().optional().or(z.literal("")),
  preferredContact: z.enum(["WHATSAPP", "PHONE", "EMAIL"]),
  garmentType: z.string().trim().min(2).max(80),
  designNotes: z.string().trim().max(600).optional().or(z.literal("")),
  colorPreference: z.string().trim().max(80).optional().or(z.literal("")),
  sizingPreference: z.enum(["STANDARD", "CUSTOM"]),
  standardSize: z.string().trim().max(10).optional().or(z.literal("")),
  bust: z.string().trim().max(20).optional().or(z.literal("")),
  waist: z.string().trim().max(20).optional().or(z.literal("")),
  hips: z.string().trim().max(20).optional().or(z.literal("")),
  shoulder: z.string().trim().max(20).optional().or(z.literal("")),
  sleeveLength: z.string().trim().max(20).optional().or(z.literal("")),
  armhole: z.string().trim().max(20).optional().or(z.literal("")),
  dressLength: z.string().trim().max(20).optional().or(z.literal("")),
  otherMeasurements: z.string().trim().max(200).optional().or(z.literal("")),
  instructions: z.string().trim().max(600).optional().or(z.literal("")),
  consultationDate: z.string().trim().max(20).optional().or(z.literal("")),
  consultationTime: z.string().trim().max(20).optional().or(z.literal("")),
  referenceImageUrl: z.string().trim().max(400).optional().or(z.literal("")),
  consent: z.literal(true),
  source: z.string().trim().max(120).optional().or(z.literal("")),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please complete the required fields.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const d = parsed.data;
  const inquiry = await db.measurementInquiry.create({
    data: {
      fullName: d.fullName,
      phone: d.phone,
      email: d.email || null,
      preferredContact: d.preferredContact,
      garmentType: d.garmentType,
      designNotes: d.designNotes || null,
      colorPreference: d.colorPreference || null,
      sizingPreference: d.sizingPreference,
      standardSize: d.standardSize || null,
      bust: d.bust || null,
      waist: d.waist || null,
      hips: d.hips || null,
      shoulder: d.shoulder || null,
      sleeveLength: d.sleeveLength || null,
      armhole: d.armhole || null,
      dressLength: d.dressLength || null,
      otherMeasurements: d.otherMeasurements || null,
      instructions: d.instructions || null,
      consultationDate: d.consultationDate || null,
      consultationTime: d.consultationTime || null,
      referenceImageUrl: d.referenceImageUrl || null,
      consent: true,
      source: d.source || null,
    },
  });
  return NextResponse.json({
    ok: true,
    inquiryId: inquiry.id,
    message:
      "Thank you! Your measurement request has been received. Our team will contact you to confirm the details — this is a request, not a confirmed appointment yet.",
  });
}
