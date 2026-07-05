import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RotateCcw, Save } from "lucide-react";
import api from "../lib/api";

interface DesignColors {
  primary: string;
  primary_hover: string;
  secondary: string;
  accent: string;
  bg_main: string;
  bg_secondary: string;
  text_main: string;
  text_secondary: string;
  btn_primary_bg: string;
  btn_primary_text: string;
  btn_secondary_bg: string;
  btn_secondary_text: string;
  link: string;
  link_hover: string;
  border: string;
  success: string;
  warning: string;
  danger: string;
}

interface DesignSettings {
  colors: DesignColors;
}

const defaultSettings: DesignSettings = {
  colors: {
    primary: "#ffa6de",
    primary_hover: "#e57fc0",
    secondary: "#8e3a6e",
    accent: "#c45b9c",
    bg_main: "#ffffff",
    bg_secondary: "#f8fafc",
    text_main: "#111827",
    text_secondary: "#6b7280",
    btn_primary_bg: "#ffa6de",
    btn_primary_text: "#4a1028",
    btn_secondary_bg: "#f3f4f6",
    btn_secondary_text: "#111827",
    link: "#c45b9c",
    link_hover: "#8e3a6e",
    border: "#e5e7eb",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
  },
};

interface ColorField {
  key: keyof DesignColors;
  label: string;
  section: string;
}

const colorFields: ColorField[] = [
  { key: "primary", label: "Cor primária", section: "Cores principais" },
  { key: "primary_hover", label: "Cor primária (hover)", section: "Cores principais" },
  { key: "secondary", label: "Cor secundária", section: "Cores principais" },
  { key: "accent", label: "Cor de destaque", section: "Cores principais" },
  { key: "bg_main", label: "Fundo principal", section: "Fundos" },
  { key: "bg_secondary", label: "Fundo secundário", section: "Fundos" },
  { key: "text_main", label: "Texto principal", section: "Textos" },
  { key: "text_secondary", label: "Texto secundário", section: "Textos" },
  { key: "btn_primary_bg", label: "Botão primário (fundo)", section: "Botões" },
  { key: "btn_primary_text", label: "Botão primário (texto)", section: "Botões" },
  { key: "btn_secondary_bg", label: "Botão secundário (fundo)", section: "Botões" },
  { key: "btn_secondary_text", label: "Botão secundário (texto)", section: "Botões" },
  { key: "link", label: "Links", section: "Links" },
  { key: "link_hover", label: "Links (hover)", section: "Links" },
  { key: "border", label: "Bordas", section: "Outros" },
  { key: "success", label: "Sucesso", section: "Estados" },
  { key: "warning", label: "Aviso", section: "Estados" },
  { key: "danger", label: "Erro", section: "Estados" },
];

function groupBySection(fields: ColorField[]): Map<string, ColorField[]> {
  const map = new Map<string, ColorField[]>();
  for (const f of fields) {
    const list = map.get(f.section) || [];
    list.push(f);
    map.set(f.section, list);
  }
  return map;
}

export default function DesignPage() {
  const queryClient = useQueryClient();
  const [colors, setColors] = useState<DesignColors>({ ...defaultSettings.colors });
  const [saved, setSaved] = useState(false);

  const { data: apiData } = useQuery({
    queryKey: ["design-settings"],
    queryFn: async () => {
      const res = await api.get("/design-settings");
      return res.data;
    },
  });

  useEffect(() => {
    if (apiData?.settings?.colors) {
      setColors({ ...defaultSettings.colors, ...apiData.settings.colors });
    }
  }, [apiData]);

  const saveMutation = useMutation({
    mutationFn: async (settings: DesignSettings) => {
      await api.put("/design-settings", { settings });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["design-settings"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      await api.post("/design-settings/reset");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["design-settings"] });
      setColors({ ...defaultSettings.colors });
    },
  });

  const updateColor = (key: keyof DesignColors, value: string) => {
    setColors((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    saveMutation.mutate({ colors });
  };

  const handleReset = () => {
    resetMutation.mutate();
  };

  const grouped = groupBySection(colorFields);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">Design</h1>
          <p className="text-text-muted text-sm mt-1">Personalize as cores da loja</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={resetMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium text-text-muted hover:bg-bg transition-colors disabled:opacity-50"
          >
            <RotateCcw size={16} />
            Restaurar padrão
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Save size={16} />
            {saveMutation.isPending ? "Salvando..." : saved ? "Salvo!" : "Salvar"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Color pickers */}
        <div className="lg:col-span-2 space-y-6">
          {Array.from(grouped.entries()).map(([section, fields]) => (
            <div key={section} className="bg-surface border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-text mb-4">{section}</h3>
              <div className="grid grid-cols-2 gap-4">
                {fields.map((field) => (
                  <div key={field.key} className="flex items-center gap-3">
                    <div className="relative">
                      <input
                        type="color"
                        value={colors[field.key]}
                        onChange={(e) => updateColor(field.key, e.target.value)}
                        className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                      />
                    </div>
                    <input
                      type="text"
                      value={colors[field.key]}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (/^#[a-fA-F0-9]{0,6}$/.test(v)) {
                          updateColor(field.key, v);
                        }
                      }}
                      onBlur={(e) => {
                        const v = e.target.value;
                        if (!/^#[a-fA-F0-9]{6}$/.test(v)) {
                          updateColor(field.key, defaultSettings.colors[field.key]);
                        }
                      }}
                      className="w-28 px-2 py-1.5 border border-border rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      placeholder="#000000"
                    />
                    <label className="text-xs text-text-muted truncate">{field.label}</label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Live preview */}
        <div className="space-y-6">
          <div className="bg-surface border border-border rounded-xl p-5 sticky top-4">
            <h3 className="text-sm font-semibold text-text mb-4">Prévia</h3>

            <div className="space-y-4" style={{ backgroundColor: colors.bg_main }}>
              {/* Buttons preview */}
              <div className="space-y-2">
                <p className="text-xs text-text-muted">Botões</p>
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg text-sm font-medium"
                  style={{ backgroundColor: colors.btn_primary_bg, color: colors.btn_primary_text }}
                >
                  Botão Primário
                </button>
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg text-sm font-medium ml-2"
                  style={{ backgroundColor: colors.btn_secondary_bg, color: colors.btn_secondary_text }}
                >
                  Botão Secundário
                </button>
              </div>

              {/* Text preview */}
              <div className="space-y-1">
                <p className="text-xs text-text-muted">Textos</p>
                <p style={{ color: colors.text_main }}>
                  Texto principal — <a href="#" style={{ color: colors.link }}>link</a>
                </p>
                <p style={{ color: colors.text_secondary }}>Texto secundário</p>
              </div>

              {/* States preview */}
              <div className="space-y-1">
                <p className="text-xs text-text-muted">Estados</p>
                <div className="flex flex-wrap gap-1">
                  <span className="px-2 py-0.5 rounded text-xs text-white" style={{ backgroundColor: colors.success }}>Sucesso</span>
                  <span className="px-2 py-0.5 rounded text-xs text-white" style={{ backgroundColor: colors.warning }}>Aviso</span>
                  <span className="px-2 py-0.5 rounded text-xs text-white" style={{ backgroundColor: colors.danger }}>Erro</span>
                </div>
              </div>

              {/* Card preview */}
              <div
                className="rounded-lg p-3 border"
                style={{ backgroundColor: colors.bg_secondary, borderColor: colors.border }}
              >
                <p style={{ color: colors.text_main }}>Card de exemplo</p>
                <p className="text-xs" style={{ color: colors.text_secondary }}>Com fundo secundário e borda</p>
              </div>

              {/* Primary color strip */}
              <div
                className="h-2 rounded-full"
                style={{ backgroundColor: colors.primary }}
              />
              <div
                className="h-2 rounded-full"
                style={{ backgroundColor: colors.secondary }}
              />
              <div
                className="h-2 rounded-full"
                style={{ backgroundColor: colors.accent }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
