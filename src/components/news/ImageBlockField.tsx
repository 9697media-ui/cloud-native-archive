import { useRef, useState } from 'react';
import { Upload, Link as LinkIcon, Loader2, Image as ImageIcon, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_DIM = 2000;
const COMPRESS_THRESHOLD = 500 * 1024;
const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp'];
const STORAGE_PUBLIC_PREFIX = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/event-attachments/`;

interface Props {
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
}

async function compress(file: File): Promise<Blob> {
  if (file.size <= COMPRESS_THRESHOLD) return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIM / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0, w, h);
  return await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b || file), 'image/jpeg', 0.85)
  );
}

async function removeIfOwned(url: string) {
  if (!url || !url.startsWith(STORAGE_PUBLIC_PREFIX)) return;
  const path = url.slice(STORAGE_PUBLIC_PREFIX.length);
  try {
    await supabase.storage.from('event-attachments').remove([path]);
  } catch {
    /* silent */
  }
}

export function ImageBlockField({ value, onChange, placeholder }: Props) {
  const initialMode: 'upload' | 'url' =
    value && !value.startsWith(STORAGE_PUBLIC_PREFIX) ? 'url' : 'upload';
  const [mode, setMode] = useState<'upload' | 'url'>(initialMode);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!ACCEPTED.includes(file.type)) {
      toast.error('Formato inválido. Use PNG, JPEG ou WebP.');
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error('Arquivo maior que 5MB.');
      return;
    }
    setUploading(true);
    try {
      const blob = await compress(file);
      const ext = blob.type === 'image/jpeg' ? 'jpg' : file.name.split('.').pop() || 'jpg';
      const now = new Date();
      const path = `news/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from('event-attachments')
        .upload(path, blob, { contentType: blob.type, upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from('event-attachments').getPublicUrl(path);
      const oldUrl = value;
      onChange(data.publicUrl);
      await removeIfOwned(oldUrl);
      toast.success('Imagem enviada.');
    } catch (e: any) {
      toast.error(`Erro no upload: ${e.message || e}`);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    const oldUrl = value;
    onChange('');
    await removeIfOwned(oldUrl);
  };

  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="flex gap-1 p-0.5 bg-muted/60 rounded-lg">
        <button
          type="button"
          onClick={() => setMode('upload')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1 text-xs font-medium rounded-md transition-colors ${
            mode === 'upload' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Upload size={12} /> Upload
        </button>
        <button
          type="button"
          onClick={() => setMode('url')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1 text-xs font-medium rounded-md transition-colors ${
            mode === 'url' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <LinkIcon size={12} /> URL
        </button>
      </div>

      {mode === 'upload' ? (
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
          role="button"
          tabIndex={0}
          aria-label="Enviar imagem"
          className="cursor-pointer rounded-lg border border-dashed border-border bg-muted/30 hover:bg-muted/50 transition-colors p-3 flex flex-col items-center justify-center gap-1 min-h-[80px]"
        >
          {uploading ? (
            <>
              <Loader2 size={18} className="animate-spin text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground">Enviando...</span>
            </>
          ) : (
            <>
              <Upload size={18} className="text-muted-foreground/60" />
              <span className="text-[11px] text-muted-foreground text-center">
                Clique ou arraste (PNG, JPG, WebP · até 5MB)
              </span>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED.join(',')}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </div>
      ) : (
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full p-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
        />
      )}

      {value ? (
        <div className="relative rounded-lg overflow-hidden border border-border bg-muted group">
          <img
            src={value}
            alt="Preview"
            className="w-full h-28 object-cover"
            onError={(e: any) => {
              e.target.style.display = 'none';
            }}
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Remover imagem"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 h-20 flex items-center justify-center">
          <ImageIcon size={20} className="text-muted-foreground/40" />
        </div>
      )}
    </div>
  );
}
