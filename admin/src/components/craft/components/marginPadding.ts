// ─── Common margin/padding schemas (reusable) ───

export const marginSchemas: PropDef[] = [
  { name: "marginTop", label: "Margin Top", type: "text", placeholder: "0 ou auto" },
  { name: "marginRight", label: "Margin Right", type: "text", placeholder: "0 ou auto" },
  { name: "marginBottom", label: "Margin Bottom", type: "text", placeholder: "0 ou auto" },
  { name: "marginLeft", label: "Margin Left", type: "text", placeholder: "0 ou auto" },
];

export const paddingSchemas: PropDef[] = [
  { name: "paddingTop", label: "Padding Top (px)", type: "number" },
  { name: "paddingRight", label: "Padding Right (px)", type: "number" },
  { name: "paddingBottom", label: "Padding Bottom (px)", type: "number" },
  { name: "paddingLeft", label: "Padding Left (px)", type: "number" },
];

// ─── Build style object from margin/padding props ───

export function marginStyle(p: Record<string, unknown>): Record<string, string | number> {
  return {
    marginTop: p.marginTop === "auto" ? "auto" : (Number(p.marginTop) || 0),
    marginRight: p.marginRight === "auto" ? "auto" : (Number(p.marginRight) || 0),
    marginBottom: p.marginBottom === "auto" ? "auto" : (Number(p.marginBottom) || 0),
    marginLeft: p.marginLeft === "auto" ? "auto" : (Number(p.marginLeft) || 0),
  };
}

export function paddingStyle(p: Record<string, unknown>): Record<string, number> {
  return {
    paddingTop: Number(p.paddingTop) || 0,
    paddingRight: Number(p.paddingRight) || 0,
    paddingBottom: Number(p.paddingBottom) || 0,
    paddingLeft: Number(p.paddingLeft) || 0,
  };
}

// ─── Default margin/padding props (zeroed) ───

export const defaultMarginPadding = {
  marginTop: 0, marginRight: 0, marginBottom: 0, marginLeft: 0,
  paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0,
};

export const defaultMarginOnly = {
  marginTop: 0, marginRight: 0, marginBottom: 0, marginLeft: 0,
};