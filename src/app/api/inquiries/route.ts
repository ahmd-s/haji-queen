import { NextRequest, NextResponse } from "next/server";
import { writeAudit } from "@/lib/audit";
import {
  hasAllowedPublicOrigin,
  originErrorResponse,
  rateLimit,
  rateLimitResponse,
  requestIp,
} from "@/lib/security";
import { serviceErrorResponse } from "@/lib/services/errors";
import { createInquiry, inquirySchema } from "@/lib/services/inquiry";

/**
 * Custom measurement inquiry transport. These are booking REQUESTS — never
 * presented as confirmed appointments.
 */
export async function POST(req: NextRequest) {
  if (!hasAllowedPublicOrigin(req)) return originErrorResponse();
  if (!rateLimit(`inquiry:${requestIp(req)}`, 5, 10 * 60 * 1000)) return rateLimitResponse();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const parsed = inquirySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please complete the required fields.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const inquiry = await createInquiry(parsed.data);
    await writeAudit(req, {
      action: "MEASUREMENT_INQUIRY_CREATED",
      entityType: "MeasurementInquiry",
      entityId: inquiry.inquiryId,
    }).catch(() => undefined);

    return NextResponse.json({
      ok: true,
      inquiryId: inquiry.inquiryId,
      message:
        "Thank you! Your measurement request has been received. Our team will contact you to confirm the details — this is a request, not a confirmed appointment yet.",
    });
  } catch (error) {
    return serviceErrorResponse(error, "Could not submit your enquiry. Please try again.");
  }
}
