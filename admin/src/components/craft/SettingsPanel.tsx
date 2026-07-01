import { useEditor } from "@craftjs/core";
import { marginSchemas, paddingSchemas } from "./components/marginPadding";

interface PropDef {
  name: string;
  label: string;
  type: "text" | "textarea" | "select" | "number" | "color" | "richtext";
  options?: { value: string; label: string }[];
  placeholder?: string;
}

const componentSchemas: Record<string, PropDef[]> = {
  TextBlock: [
    { name: "content", label: "Conteúdo", type: "textarea" },
    { name: "fontSize", label: "Tamanho (px)", type: "number" },
    { name: "color", label: "Cor", type: "color" },
    { name: "textAlign", label: "Alinhamento", type: "select", options: [
      { value: "left", label: "Esquerda" },
      { value: "center", label: "Centro" },
      { value: "right", label: "Direita" },
    ]},
    ...marginSchemas,
    ...paddingSchemas,
  ],
  Title: [
    { name: "text", label: "Texto", type: "text" },
    { name: "level", label: "Nível", type: "select", options: [
      { value: "h1", label: "H1" }, { value: "h2", label: "H2" },
      { value: "h3", label: "H3" }, { value: "h4", label: "H4" },
      { value: "h5", label: "H5" }, { value: "h6", label: "H6" },
    ]},
    { name: "align", label: "Alinhamento", type: "select", options: [
      { value: "left", label: "Esquerda" }, { value: "center", label: "Centro" }, { value: "right", label: "Direita" },
    ]},
    { name: "color", label: "Cor", type: "color" },
    ...marginSchemas,
    ...paddingSchemas,
  ],
  ImageBlock: [
    { name: "src", label: "URL da imagem", type: "text" },
    { name: "alt", label: "Texto alternativo", type: "text" },
    { name: "href", label: "Link (opcional)", type: "text" },
    { name: "borderRadius", label: "Bordas arredondadas (px)", type: "number" },
    ...marginSchemas,
    ...paddingSchemas,
  ],
  ButtonBlock: [
    { name: "label", label: "Texto", type: "text" },
    { name: "href", label: "Link", type: "text" },
    { name: "variant", label: "Estilo", type: "select", options: [
      { value: "primary", label: "Primário" }, { value: "secondary", label: "Secundário" }, { value: "outline", label: "Contorno" },
    ]},
    { name: "size", label: "Tamanho", type: "select", options: [
      { value: "sm", label: "Pequeno" }, { value: "md", label: "Médio" }, { value: "lg", label: "Grande" },
    ]},
    { name: "borderRadius", label: "Bordas arredondadas (px)", type: "number" },
    ...marginSchemas,
    ...paddingSchemas,
  ],
  Banner: [
    { name: "imageSrc", label: "URL da imagem", type: "text" },
    { name: "title", label: "Título", type: "text" },
    { name: "subtitle", label: "Subtítulo", type: "text" },
    { name: "buttonLabel", label: "Texto do botão", type: "text" },
    { name: "buttonHref", label: "Link do botão", type: "text" },
    { name: "overlayOpacity", label: "Opacidade overlay (%)", type: "number" },
    { name: "height", label: "Altura (px)", type: "number" },
    { name: "textColor", label: "Cor do texto", type: "color" },
    { name: "borderRadius", label: "Bordas arredondadas (px)", type: "number" },
    ...marginSchemas,
    ...paddingSchemas,
  ],
  Spacer: [
    { name: "height", label: "Altura (px)", type: "number" },
    ...marginSchemas,
  ],
  Columns: [
    { name: "columns", label: "Número de colunas", type: "select", options: [
      { value: "2", label: "2" }, { value: "3", label: "3" }, { value: "4", label: "4" },
    ]},
    { name: "gap", label: "Espaçamento (px)", type: "number" },
    { name: "borderRadius", label: "Bordas arredondadas (px)", type: "number" },
    ...marginSchemas,
    ...paddingSchemas,
  ],
  VideoBlock: [
    { name: "url", label: "URL do vídeo", type: "text" },
    { name: "platform", label: "Plataforma", type: "select", options: [
      { value: "youtube", label: "YouTube" }, { value: "vimeo", label: "Vimeo" },
    ]},
    { name: "aspectRatio", label: "Proporção", type: "select", options: [
      { value: "16:9", label: "16:9" }, { value: "4:3", label: "4:3" }, { value: "1:1", label: "1:1" },
    ]},
    { name: "borderRadius", label: "Bordas arredondadas (px)", type: "number" },
    ...marginSchemas,
    ...paddingSchemas,
  ],
  ProductGrid: [
    { name: "title", label: "Título", type: "text" },
    { name: "limit", label: "Quantidade", type: "number" },
    { name: "columns", label: "Colunas", type: "select", options: [
      { value: "2", label: "2" }, { value: "3", label: "3" }, { value: "4", label: "4" },
    ]},
    { name: "borderRadius", label: "Bordas arredondadas (px)", type: "number" },
    ...marginSchemas,
    ...paddingSchemas,
  ],
  CustomHtml: [
    { name: "html", label: "Código HTML", type: "textarea" },
    ...marginSchemas,
  ],
  Container: [
    { name: "width", label: "Largura", type: "text", placeholder: "auto ou px" },
    { name: "height", label: "Altura", type: "text", placeholder: "auto ou px" },
    { name: "hAlign", label: "Alinhamento horizontal", type: "select", options: [
      { value: "left", label: "Esquerda" },
      { value: "center", label: "Centro" },
      { value: "right", label: "Direita" },
    ]},
    { name: "vAlign", label: "Alinhamento vertical", type: "select", options: [
      { value: "top", label: "Topo" },
      { value: "center", label: "Centro" },
      { value: "bottom", label: "Fundo" },
      { value: "stretch", label: "Esticar" },
    ]},
    { name: "backgroundColor", label: "Cor de fundo", type: "color" },
    { name: "borderRadius", label: "Bordas arredondadas (px)", type: "number" },
    { name: "padding", label: "Espaçamento interno (px)", type: "number" },
    ...marginSchemas,
    ...paddingSchemas,
  ],
};

const inputClass = "w-full rounded border border-border px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500/30 bg-bg";

export default function SettingsPanel() {
  const { selected, actions } = useEditor((state) => {
    const nodeIds = Array.from(state.events.selected);
    if (nodeIds.length === 0) return { selected: null };
    const node = state.nodes[nodeIds[0]];
    return { selected: node };
  });

  if (!selected || !selected.data) {
    return (
      <div className="p-4">
        <p className="text-xs text-text-muted">Selecione um componente para editar suas propriedades.</p>
      </div>
    );
  }

  const displayName = selected.data.displayName || selected.data.name || "Componente";
  const schema = componentSchemas[displayName];

  if (!schema) {
    return (
      <div className="p-4">
        <p className="text-xs font-medium text-text mb-1">{displayName}</p>
        <p className="text-xs text-text-muted mb-2">Sem propriedades editáveis.</p>
        <p className="text-[10px] text-text-muted font-mono break-all bg-bg p-1 rounded">
          name: {selected.data.name}<br />
          displayName: {selected.data.displayName}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <p className="text-xs font-semibold text-text uppercase tracking-wider">{displayName}</p>
      {schema.map((prop) => {
        const value = selected.data.props?.[prop.name];
        const id = `${selected.id}-${prop.name}`;
        return (
          <div key={prop.name}>
            <label htmlFor={id} className="block text-xs text-text-muted mb-0.5">{prop.label}</label>
            {prop.type === "select" ? (
              <select
                id={id}
                value={String(value ?? "")}
                onChange={(e) => actions.setProp(selected.id, (props: Record<string, unknown>) => { props[prop.name] = e.target.value; })}
                className={inputClass}
              >
                {prop.options?.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : prop.type === "textarea" ? (
              <textarea
                id={id}
                value={String(value ?? "")}
                onChange={(e) => actions.setProp(selected.id, (props: Record<string, unknown>) => { props[prop.name] = e.target.value; })}
                className={inputClass}
                placeholder={prop.placeholder}
                rows={4}
              />
            ) : prop.type === "color" ? (
              <div className="flex gap-2">
                <input
                  type="color"
                  id={id}
                  value={String(value ?? "#000000")}
                  onChange={(e) => actions.setProp(selected.id, (props: Record<string, unknown>) => { props[prop.name] = e.target.value; })}
                  className="w-8 h-8 rounded border border-border cursor-pointer"
                />
                <input
                  type="text"
                  value={String(value ?? "")}
                  onChange={(e) => actions.setProp(selected.id, (props: Record<string, unknown>) => { props[prop.name] = e.target.value; })}
                  className={`${inputClass} flex-1 font-mono`}
                />
              </div>
            ) : prop.type === "richtext" ? (
              <textarea
                id={id}
                value={String(value ?? "")}
                onChange={(e) => actions.setProp(selected.id, (props: Record<string, unknown>) => { props[prop.name] = e.target.value; })}
                className={inputClass}
                rows={3}
              />
            ) : (
              <input
                type={prop.type === "number" ? "number" : "text"}
                id={id}
                value={prop.type === "number" ? Number(value ?? 0) : String(value ?? "")}
                onChange={(e) => actions.setProp(selected.id, (props: Record<string, unknown>) => { props[prop.name] = prop.type === "number" ? Number(e.target.value) : e.target.value; })}
                className={inputClass}
                placeholder={prop.placeholder}
                step={prop.type === "number" ? "any" : undefined}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
