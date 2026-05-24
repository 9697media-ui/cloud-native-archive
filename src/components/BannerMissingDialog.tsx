import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, ImagePlus, CheckCircle2 } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onAddImage: () => void;
}

export function BannerMissingDialog({ open, onOpenChange, onConfirm, onAddImage }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 mb-4">
            <AlertCircle className="h-6 w-6 text-amber-600" />
          </div>
          <DialogTitle className="text-center text-xl">Banner sem imagem!</DialogTitle>
          <DialogDescription className="text-center pt-2">
            Este evento não possui uma arte de banner dedicada. Se você publicar assim, usaremos a <strong>cor do card</strong> como fundo e o <strong>título ganhará destaque total</strong> no carrossel.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 py-4">
          <Button 
            variant="outline" 
            className="flex items-center justify-start gap-3 h-auto py-4 px-6 border-amber-200 hover:bg-amber-50"
            onClick={onAddImage}
          >
            <div className="bg-amber-100 p-2 rounded-lg">
              <ImagePlus className="h-5 w-5 text-amber-600" />
            </div>
            <div className="text-left">
              <p className="font-bold text-sm">Adicionar Imagem agora</p>
              <p className="text-xs text-muted-foreground">Recomendado para melhor visual</p>
            </div>
          </Button>
          
          <Button 
            variant="ghost" 
            className="flex items-center justify-start gap-3 h-auto py-4 px-6 hover:bg-muted"
            onClick={onConfirm}
          >
            <div className="bg-muted p-2 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-left">
              <p className="font-bold text-sm">Publicar sem imagem</p>
              <p className="text-xs text-muted-foreground">Usar cor e título em destaque</p>
            </div>
          </Button>
        </div>
        <DialogFooter className="sm:justify-center">
          <Button variant="link" className="text-muted-foreground text-xs" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
