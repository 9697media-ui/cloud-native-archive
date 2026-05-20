import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Paperclip, X } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  attachments?: string[];
  url?: string;
  onChange: (value: any) => void;
  mode?: 'multiple' | 'single';
  label?: string;
}

export function FileUpload({ attachments = [], url = '', onChange, mode = 'multiple', label = 'Anexos' }: Props) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newAttachments = [...attachments];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { data, error } = await supabase.storage
          .from('event-attachments')
          .upload(filePath, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('event-attachments')
          .getPublicUrl(data.path);

        if (mode === 'single') {
          onChange(publicUrl);
          toast.success('Upload realizado com sucesso!');
          break; // Only one file for single mode
        } else {
          newAttachments.push(publicUrl);
        }
      }

      if (mode === 'multiple') {
        onChange(newAttachments);
        toast.success('Arquivos enviados com sucesso!');
      }
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast.error(`Erro no upload: ${error.message}`);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const removeAttachment = (url: string) => {
    onChange(attachments.filter((a) => a !== url));
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">{label}</Label>
      
      {mode === 'multiple' && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((url, idx) => (
            <div 
              key={idx} 
              className="flex items-center gap-2 bg-muted/50 border border-border rounded-md px-3 py-1.5 text-xs group"
            >
              <Paperclip className="h-3 w-3 text-muted-foreground" />
              <a 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="max-w-[150px] truncate hover:underline text-foreground"
              >
                Anexo {idx + 1}
              </a>
              <button
                type="button"
                onClick={() => removeAttachment(url)}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {mode === 'single' && url && (
        <div className="relative aspect-video rounded-lg overflow-hidden border border-border group">
          <img src={url} alt="Preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="relative">
        <Input
          type="file"
          multiple={mode === 'multiple'}
          accept="image/*"
          onChange={handleFileChange}
          disabled={isUploading}
          className="cursor-pointer"
        />
        {isUploading && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-md">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span className="text-xs">Enviando...</span>
          </div>
        )}
      </div>
    </div>
  );
}
