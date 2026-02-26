import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";

const resend = new Resend(process.env.RESEND_API_KEY);
const from = process.env.FROM_EMAIL || "JTSG Employer Network <onboarding@resend.dev>";

export async function sendNewEmployerNotificationToCRS(employer: {
  id: string;
  company_name: string;
  created_at: string;
}) {
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
