import React from 'react';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface ColorFieldProps {
  value?: string;
  onChange: (value: string) => void;
  className?: string;
  swatchClassName?: string;
}

const parse = (value?: string): { hex: string; alpha: number } => {
  const v = (value || '').trim();
  if (!v || v === 'transparent') return { hex: '#000000', alpha: v === 'transparent' ? 0 : 100 };
  if (/^#([0-9a-fA-F]{8})$/.test(v)) {
    return { hex: v.slice(0, 7), alpha: Math.round((parseInt(v.slice(7, 9), 16) / 255) * 100) };
  }
  if (/^#([0-9a-fA-F]{6})$/.test(v)) return { hex: v, alpha: 100 };
  if (/^#([0-9a-fA-F]{3})$/.test(v)) {
    return { hex: `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`, alpha: 100 };
  }
  return { hex: '#000000', alpha: 100 };
};

const compose = (hex: string, alpha: number): string => {
  if (alpha >= 100) return hex;
  const a = Math.round((alpha / 100) * 255).toString(16).padStart(2, '0');
  return `${hex}${a}`;
};

export const ColorField: React.FC<ColorFieldProps> = ({ value, onChange, className, swatchClassName }) => {
  const { hex, alpha } = parse(value);
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-center gap-2">
        <Input
          type="color"
          className={cn('w-10 h-10 p-1 cursor-pointer shrink-0', swatchClassName)}
          value={hex}
          onChange={(e) => onChange(compose(e.target.value, alpha))}
        />
        <span className="text-xs font-mono uppercase truncate">{compose(hex, alpha)}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground w-12 shrink-0">Opac.</span>
        <Slider
          min={0}
          max={100}
          step={1}
          value={[alpha]}
          onValueChange={([a]) => onChange(compose(hex, a))}
        />
        <span className="text-[10px] text-muted-foreground w-8 text-right shrink-0">{alpha}%</span>
      </div>
    </div>
  );
};

export default ColorField;
