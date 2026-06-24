import React from 'react';
import { HexAlphaColorPicker } from 'react-colorful';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface ColorFieldProps {
  value?: string;
  onChange: (value: string) => void;
  className?: string;
}

// Normaliza qualquer entrada para um hex de 8 dígitos (#rrggbbaa) usado pelo picker.
const toHex8 = (value?: string): string => {
  const v = (value || '').trim();
  if (!v || v === 'transparent') return '#00000000';
  if (/^#[0-9a-fA-F]{8}$/.test(v)) return v.toLowerCase();
  if (/^#[0-9a-fA-F]{6}$/.test(v)) return `${v.toLowerCase()}ff`;
  if (/^#[0-9a-fA-F]{3}$/.test(v)) {
    return `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}ff`;
  }
  return '#000000ff';
};

// Devolve hex6 quando totalmente opaco, hex8 caso contrário (compatível com CSS).
const fromHex8 = (hex8: string): string =>
  hex8.slice(7, 9).toLowerCase() === 'ff' ? hex8.slice(0, 7) : hex8;

const alphaPercent = (hex8: string): number =>
  Math.round((parseInt(hex8.slice(7, 9) || 'ff', 16) / 255) * 100);

export const ColorField: React.FC<ColorFieldProps> = ({ value, onChange, className }) => {
  const hex8 = toHex8(value);
  const display = fromHex8(hex8);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex w-full items-center gap-2 rounded-md border border-input bg-background px-2 py-1.5 text-left hover:bg-accent/50 transition-colors',
            className
          )}
        >
          <span
            className="h-6 w-6 shrink-0 rounded border"
            style={{
              backgroundImage:
                'linear-gradient(45deg,#ccc 25%,transparent 25%),linear-gradient(-45deg,#ccc 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#ccc 75%),linear-gradient(-45deg,transparent 75%,#ccc 75%)',
              backgroundSize: '8px 8px',
              backgroundPosition: '0 0,0 4px,4px -4px,-4px 0',
            }}
          >
            <span className="block h-full w-full rounded" style={{ backgroundColor: hex8 }} />
          </span>
          <span className="flex-1 truncate text-xs font-mono uppercase">{display}</span>
          <span className="text-[10px] text-muted-foreground">{alphaPercent(hex8)}%</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3 space-y-3" align="start">
        <HexAlphaColorPicker color={hex8} onChange={(c) => onChange(fromHex8(toHex8(c)))} />
        <div className="flex items-center gap-2">
          <Input
            className="h-8 text-xs font-mono uppercase"
            value={display}
            onChange={(e) => {
              const next = e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`;
              onChange(next);
            }}
          />
          <div className="flex items-center gap-1">
            <Input
              type="number"
              min={0}
              max={100}
              className="h-8 w-16 text-xs"
              value={alphaPercent(hex8)}
              onChange={(e) => {
                const a = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                const aHex = Math.round((a / 100) * 255).toString(16).padStart(2, '0');
                onChange(fromHex8(`${hex8.slice(0, 7)}${aHex}`));
              }}
            />
            <span className="text-[10px] text-muted-foreground">%</span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ColorField;
