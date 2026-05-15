"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Bot, Building2, Plug } from "lucide-react";
import { AiSettingsForm } from "./ai-form";
import type { AiSettings } from "@/db/schema";

export function SettingsTabs({
  initialTab,
  aiSettings,
}: {
  initialTab: string;
  aiSettings: AiSettings | null;
}) {
  const t = useTranslations("admin.settings");
  const [tab, setTab] = useState(initialTab);
  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList className="w-full justify-start mb-2">
        <TabsTrigger value="ai">
          <Bot className="size-4 mr-1.5" /> {t("tabAi")}
        </TabsTrigger>
        <TabsTrigger value="general" disabled>
          <Building2 className="size-4 mr-1.5" /> {t("tabGeneral")}
        </TabsTrigger>
        <TabsTrigger value="integrations" disabled>
          <Plug className="size-4 mr-1.5" /> {t("tabIntegrations")}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="ai">
        <AiSettingsForm initial={aiSettings} />
      </TabsContent>
      <TabsContent value="general">
        <ComingSoon name={t("comingSoonGeneral")} hint={t("comingSoonGeneralHint")} pillLabel={t("comingSoonPill")} />
      </TabsContent>
      <TabsContent value="integrations">
        <ComingSoon name={t("comingSoonIntegrations")} hint={t("comingSoonIntegrationsHint")} pillLabel={t("comingSoonPill")} />
      </TabsContent>
    </Tabs>
  );
}

function ComingSoon({ name, hint, pillLabel }: { name: string; hint: string; pillLabel: string }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-stone-200 p-12 text-center">
      <div className="text-sm font-semibold text-stone-700 mb-1">{name}</div>
      <div className="text-xs text-stone-500">{hint}</div>
      <div className="mt-3 inline-block text-[11px] bg-stone-100 text-stone-500 px-2 py-1 rounded-full">
        {pillLabel}
      </div>
    </div>
  );
}
