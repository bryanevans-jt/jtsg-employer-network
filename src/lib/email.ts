import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";

export async function sendNewEmployerNotificationToCRS(employer: {
  id: string;
  company_name: string;
  created_at: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const supabase = createAdminClient();
  const { data: crsProfiles } = await supabase
    .from("profiles")
    .select("email")
    .eq("role", "crs");

  if (!crsProfiles?.length) return;

  const to = crsProfiles.map((p) => p.email);
  const date = new Date(employer.created_at).toLocaleDateString("en-US", {
    dateStyle: "medium",
  });
  const from = process.env.FROM_EMAIL || "JTSG Employer Network <onboarding@resend.dev>";
  const resend = new Resend(apiKey);

  await resend.emails.send({
    from,
    to,
    subject: `New employer submission: ${employer.company_name}`,
    html: `
      <p>A new employer has joined the JTSG Employer Network.</p>
      <p><strong>Company:</strong> ${employer.company_name}</p>
      <p><strong>Submitted:</strong> ${date}</p>
      <p>Log in to the Employer Network dashboard to review and mark them as an Active Partner when appropriate.</p>
    `,
  });
}
