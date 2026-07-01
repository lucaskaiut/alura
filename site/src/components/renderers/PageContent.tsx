import SafeHtml from "@/components/ui/SafeHtml";
import CraftPageRenderer from "./craft/CraftPageRenderer";

interface PageData {
  title: string;
  content?: string;
  body?: string;
  sections?: { id: string; type: string; content: string }[];
}

function isCraftJson(content: string): boolean {
  try {
    let parsed = JSON.parse(content);
    // Handle double-escaped JSON (from old saves)
    if (typeof parsed === "string") {
      parsed = JSON.parse(parsed);
    }
    return parsed && typeof parsed === "object" && "ROOT" in parsed;
  } catch {
    return false;
  }
}

function parseCraftJson(content: string): Record<string, unknown> {
  try {
    let parsed = JSON.parse(content);
    if (typeof parsed === "string") {
      parsed = JSON.parse(parsed);
    }
    return parsed as Record<string, unknown>;
  } catch {
    return {};
  }
}

export default function PageContent({ page }: { page: PageData }) {
  const rawContent = page.content || page.body || "";

  if (rawContent && isCraftJson(rawContent)) {
    return (
      <CraftPageRenderer data={parseCraftJson(rawContent) as Record<string, { type: string; props: Record<string, unknown>; nodes?: string[]; linkedNodes?: Record<string, string>; hidden?: boolean }>} />
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold text-text">{page.title}</h1>
      <div className="prose prose-lg mt-6 max-w-none">
        {rawContent ? (
          <SafeHtml html={rawContent} />
        ) : page.sections ? (
          page.sections.map((section) => (
            <div key={section.id} className="mb-8">
              <SafeHtml html={section.content} />
            </div>
          ))
        ) : null}
      </div>
    </div>
  );
}
