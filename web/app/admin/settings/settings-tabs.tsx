"use client";

import { useState } from "react";
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
  const [tab, setTab] = useState(initialTab);
  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList className="w-full justify-start mb-2">
        <TabsTrigger value="ai">
          <Bot className="size-4 mr-1.5" /> AI Models
        </TabsTrigger>
        <TabsTrigger value="general" disabled>
          <Building2 className="size-4 mr-1.5" /> General
        </TabsTrigger>
        <TabsTrigger value="integrations" disabled>
          <Plug className="size-4 mr-1.5" /> Integrations
        </TabsTrigger>
      </TabsList>
      <TabsContent value="ai">
        <AiSettingsForm initial={aiSettings} />
      </TabsContent>
      <TabsContent value="general">
        <ComingSoon name="General settings" hint="Branding, defaults, locale fallback..." />
      </TabsContent>
      <TabsContent value="integrations">
        <ComingSoon name="Integrations" hint="YouTube, Speechace, Webhooks..." />
      </TabsContent>
    </Tabs>
  );
}

function ComingSoon({ name, hint }: { name: string; hint: string }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-stone-200 p-12 text-center">
      <div className="text-sm font-semibold text-stone-700 mb-1">{name}</div>
      <div className="text-xs text-stone-500">{hint}</div>
      <div className="mt-3 inline-block text-[11px] bg-stone-100 text-stone-500 px-2 py-1 rounded-full">
        Coming in phase 2
      </div>
    </div>
  );
}
