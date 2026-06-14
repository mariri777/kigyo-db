"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
  mono,
  hint,
  error,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
  mono?: boolean;
  hint?: string;
  error?: string;
}) {
  return (
    <div>
      <Label htmlFor={name} className="mb-1 block">
        {label}
      </Label>
      <Input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        className={mono ? "font-mono" : undefined}
      />
      {error ? (
        <p className="text-xs text-red-400 mt-1">{error}</p>
      ) : hint ? (
        <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>
      ) : null}
    </div>
  );
}

export function FieldTextArea({
  label,
  name,
  defaultValue,
  rows = 3,
  required,
  error,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  rows?: number;
  required?: boolean;
  error?: string;
}) {
  return (
    <div>
      <Label htmlFor={name} className="mb-1 block">
        {label}
      </Label>
      <Textarea
        id={name}
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        required={required}
      />
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}

export function SelectField({
  label,
  name,
  defaultValue,
  options,
  error,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  options: { value: string; label: string }[];
  error?: string;
}) {
  return (
    <div>
      <Label htmlFor={name} className="mb-1 block">
        {label}
      </Label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue}
        className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-border-strong"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}
