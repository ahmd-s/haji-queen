import { z } from "zod";
import { db } from "@/lib/db";
import { ServiceError } from "@/lib/services/errors";

/**
 * Measurement enquiries are booking REQUESTS, never confirmed appointments.
 * Stored for admin review only; no notification is implied by this service.
 */
export const inquirySchema = z.object({
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

export type CreateInquiryInput = z.infer<typeof inquirySchema>;

const EMPTY_TO_NULL = (value: string | undefined | null): string | null =>
  value ? value : null;

export async function createInquiry(input: CreateInquiryInput): Promise<{ inquiryId: string }> {
  if (input.consent !== true) {
    throw new ServiceError("VALIDATION", "Please provide your consent before submitting.");
  }

  const inquiry = await db.measurementInquiry.create({
    data: {
      fullName: input.fullName,
      phone: input.phone,
      email: EMPTY_TO_NULL(input.email),
      preferredContact: input.preferredContact,
      garmentType: input.garmentType,
      designNotes: EMPTY_TO_NULL(input.designNotes),
      colorPreference: EMPTY_TO_NULL(input.colorPreference),
      sizingPreference: input.sizingPreference,
      standardSize: EMPTY_TO_NULL(input.standardSize),
      bust: EMPTY_TO_NULL(input.bust),
      waist: EMPTY_TO_NULL(input.waist),
      hips: EMPTY_TO_NULL(input.hips),
      shoulder: EMPTY_TO_NULL(input.shoulder),
      sleeveLength: EMPTY_TO_NULL(input.sleeveLength),
      armhole: EMPTY_TO_NULL(input.armhole),
      dressLength: EMPTY_TO_NULL(input.dressLength),
      otherMeasurements: EMPTY_TO_NULL(input.otherMeasurements),
      instructions: EMPTY_TO_NULL(input.instructions),
      consultationDate: EMPTY_TO_NULL(input.consultationDate),
      consultationTime: EMPTY_TO_NULL(input.consultationTime),
      referenceImageUrl: EMPTY_TO_NULL(input.referenceImageUrl),
      consent: true,
      source: EMPTY_TO_NULL(input.source),
    },
  });
  return { inquiryId: inquiry.id };
}
