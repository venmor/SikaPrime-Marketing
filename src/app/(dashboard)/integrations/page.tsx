import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/ui/section-card";
import { SubmitButton } from "@/components/ui/submit-button";
import { canManageIntegrations } from "@/lib/auth/access";
import { requireSession } from "@/lib/auth/session";
import { getIntegrationSettings } from "@/lib/integrations/service";
import { saveIntegrationSettingAction } from "@/server/actions/integrations";

function isBooleanSetting(key: string, value: string) {
  return key.endsWith("_enabled") || value === "true" || value === "false";
}

function isLongTextSetting(key: string) {
  return key.includes("feed") || key.includes("webhook");
}

function isSelectSetting(key: string) {
  return key === "openai.image_model" || key === "openai.image_size";
}

export default async function IntegrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const [session, params, settings] = await Promise.all([
    requireSession(),
    searchParams,
    getIntegrationSettings(),
  ]);

  if (!canManageIntegrations(session.role)) {
    redirect("/dashboard");
  }

  return (
    <div className="grid gap-6">
      {params.saved === "1" ? (
        <div className="alert-success rounded-2xl p-4 text-sm">
          Integration settings saved. Runtime services will use the new values on
          the next request.
        </div>
      ) : null}
      {params.error === "invalid" ? (
        <div className="alert-danger rounded-2xl p-4 text-sm">
          One or more settings were missing required metadata.
        </div>
      ) : null}

      <SectionCard
        title="Integration control center"
        description="Manage AI, publishing, email delivery, and social-signal settings without editing environment files or touching code."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[color:var(--border)] bg-surface-strong p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-[color:var(--muted)]">
              AI generation
            </p>
            <p className="mt-2 text-sm text-[color:var(--muted)]">
              Control the text model, image model, and generated flyer size from
              one place.
            </p>
          </div>
          <div className="rounded-2xl border border-[color:var(--border)] bg-surface-strong p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-[color:var(--muted)]">
              Publishing
            </p>
            <p className="mt-2 text-sm text-[color:var(--muted)]">
              Update Facebook and WhatsApp connection details so the team does not
              need to redeploy for routine token changes.
            </p>
          </div>
          <div className="rounded-2xl border border-[color:var(--border)] bg-surface-strong p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-[color:var(--muted)]">
              Email + monitoring
            </p>
            <p className="mt-2 text-sm text-[color:var(--muted)]">
              Configure SMTP delivery for invites, resets, and OTPs, then turn on
              approved feeds for Google Trends, Meta, Instagram, TikTok, or
              external monitoring providers.
            </p>
          </div>
        </div>
      </SectionCard>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        {Object.entries(settings.grouped).map(([groupLabel, groupSettings]) => (
          <SectionCard
            key={groupLabel}
            title={groupLabel}
            description={
              groupLabel === "Social listening"
                ? "Enabled feeds are merged into the trend engine during refresh. Feed URLs may be RSS or JSON endpoints exposing title, summary, url, and publishedAt."
                : groupLabel === "Email delivery"
                  ? "SMTP settings saved here power invite emails, password resets, and optional sign-in verification codes."
                : groupLabel === "Publishing"
                  ? "Publishing values saved here are used at runtime for Facebook, WhatsApp, and Meta metrics sync."
                  : "These settings control the text and image generation engines that power the content lab and flyer studio."
            }
          >
            <div className="grid gap-4">
              {groupSettings.map((setting) => {
                const currentValue = settings.map[setting.key] ?? "";
                const valueType = isBooleanSetting(setting.key, currentValue)
                  ? "boolean"
                  : "text";

                return (
                  <form
                    key={setting.id}
                    action={saveIntegrationSettingAction}
                    className="grid gap-4 rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5"
                  >
                    <input type="hidden" name="id" value={setting.id} />
                    <input type="hidden" name="key" value={setting.key} />
                    <input type="hidden" name="label" value={setting.label} />
                    <input type="hidden" name="groupLabel" value={setting.groupLabel} />
                    <input
                      type="hidden"
                      name="helpText"
                      value={setting.helpText ?? ""}
                    />
                    <input
                      type="hidden"
                      name="isSecret"
                      value={setting.isSecret ? "true" : "false"}
                    />
                    <input type="hidden" name="valueType" value={valueType} />

                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-display text-lg font-semibold text-[color:var(--foreground)]">
                            {setting.label}
                          </h3>
                          {setting.isSecret ? (
                            <Badge variant="warning">Secret</Badge>
                          ) : null}
                          {currentValue ? (
                            <Badge variant="success">Configured</Badge>
                          ) : (
                            <Badge variant="muted">Empty</Badge>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-[color:var(--muted)]">
                          {setting.helpText ??
                            "Keep this setting updated so the connected workflow stays healthy."}
                        </p>
                        <p className="mt-2 text-xs font-medium uppercase tracking-[0.22em] text-[color:var(--muted)]">
                          {setting.key}
                        </p>
                      </div>
                    </div>

                    {valueType === "boolean" ? (
                      <label>
                        <span>Enabled</span>
                        <select name="value" defaultValue={currentValue || "false"}>
                          <option value="true">Enabled</option>
                          <option value="false">Disabled</option>
                        </select>
                      </label>
                    ) : isSelectSetting(setting.key) ? (
                      <label>
                        <span>Value</span>
                        <select name="value" defaultValue={currentValue}>
                          {setting.key === "openai.image_model" ? (
                            <>
                              <option value="gpt-image-1">gpt-image-1</option>
                              <option value="gpt-image-1-mini">gpt-image-1-mini</option>
                              <option value="gpt-image-1.5">gpt-image-1.5</option>
                            </>
                          ) : (
                            <>
                              <option value="1024x1536">1024x1536 Portrait</option>
                              <option value="1024x1024">1024x1024 Square</option>
                              <option value="1536x1024">1536x1024 Landscape</option>
                            </>
                          )}
                        </select>
                      </label>
                    ) : isLongTextSetting(setting.key) ? (
                      <label>
                        <span>Endpoint URL</span>
                        <textarea
                          name="value"
                          defaultValue={currentValue}
                          placeholder="https://example.com/feed.json"
                        />
                      </label>
                    ) : (
                      <label>
                        <span>Value</span>
                        <input
                          name="value"
                          type={setting.isSecret ? "password" : "text"}
                          defaultValue={currentValue}
                          placeholder={
                            setting.isSecret
                              ? "Paste the secure token or API key"
                              : "Enter the value"
                          }
                        />
                      </label>
                    )}

                    <SubmitButton pendingLabel="Saving setting...">
                      Save setting
                    </SubmitButton>
                  </form>
                );
              })}
            </div>
          </SectionCard>
        ))}
      </section>

      <SectionCard
        title="Approved social feed format"
        description="Feed URLs used by the trend engine should expose either RSS/Atom XML or JSON with a predictable structure."
      >
        <pre className="overflow-x-auto rounded-[24px] border border-[color:var(--border)] bg-slate-950/95 p-5 text-xs leading-6 text-slate-100">
{`{
  "items": [
    {
      "title": "Youth side hustle ideas are trending",
      "summary": "Audience conversation is centering on student income and growth mindset.",
      "url": "https://provider.example/signal/youth-side-hustles",
      "publishedAt": "2026-04-04T08:30:00.000Z"
    }
  ]
}`}
        </pre>
      </SectionCard>
    </div>
  );
}
