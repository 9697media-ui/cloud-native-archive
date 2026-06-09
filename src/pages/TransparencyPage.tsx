import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { 
  Folder, 
  ChevronRight, 
  ChevronDown, 
  FileText, 
  ExternalLink, 
  Loader2, 
  Search,
  Settings,
  Plus,
  Trash2,
  Copy,
  Check,
  LogIn,
  Download,
  Maximize2,
  X,
  FileCode,
  FileSpreadsheet,
  FileVideo,
  FileImage,
  FileArchive,
  File
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// This is a simplified representation of the Google Drive folder structure.
// In a real production app, we would use an Edge Function to proxy requests to the Google Drive API.
// Since we don't have Google API keys yet, we'll implement the UI and the structure
// and simulate the data fetching.

interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
  children?: DriveItem[];
}

const TransparencyPage = () => {
  const { isAdmin } = useUserRole();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [newFolderId, setNewFolderId] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [hasGoogleAuth, setHasGoogleAuth] = useState<boolean | null>(null);

  const checkGoogleAuth = useCallback(async () => {
    const { data } = await supabase
      .from('global_settings')
      .select('value')
      .eq('key', 'google_drive_refresh_token')
      .maybeSingle();
    const value = data?.value as any;
    setHasGoogleAuth(!!value?.refresh_token);
  }, []);

  useEffect(() => {
    const handleOAuthResponse = async () => {
      const hash = window.location.hash;
      const isGoogleAuth = searchParams.get('type') === 'google_auth' || hash.includes('access_token=');
      
      if (isGoogleAuth) {
        setLoading(true);
        try {
          await new Promise(resolve => setTimeout(resolve, 500));
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.provider_refresh_token) {
            const { error: updateError } = await supabase
              .from('global_settings')
              .upsert({ 
                key: 'google_drive_refresh_token', 
                value: { refresh_token: session.provider_refresh_token } 
              });
            
            if (!updateError) {
              toast.success('Google Drive conectado globalmente!');
              setHasGoogleAuth(true);
            }
          } else {
            const { data } = await supabase.from('global_settings').select('value').eq('key', 'google_drive_refresh_token').maybeSingle();
            if (data?.value) {
              setHasGoogleAuth(true);
            }
          }
        } catch (err: any) {
          console.error(err);
        } finally {
          searchParams.delete('type');
          setSearchParams(searchParams, { replace: true });
          window.location.hash = '';
          setLoading(false);
          checkGoogleAuth();
        }
      }
    };

    handleOAuthResponse();
    checkGoogleAuth();
  }, [checkGoogleAuth, searchParams, setSearchParams]);

  // Handle iframe height communication
  useEffect(() => {
    if (searchParams.get('embed') === 'true') {
      const calculateHeight = () => {
        const root = document.getElementById('root');
        if (root) {
          // Find the exact content container
          const contentElement = root.querySelector('.bg-transparent.w-full.overflow-hidden.m-0');
          // Using offsetHeight to get the exact pixel height including borders
          const height = contentElement ? (contentElement as HTMLElement).offsetHeight : root.offsetHeight;
          
          if (height > 0) {
            window.parent.postMessage({ type: 'resize-iframe', height }, '*');
          }
        }
      };

      // Periodic check to ensure height is always accurate as folders expand/collapse
      const interval = setInterval(calculateHeight, 500);

      const resizeObserver = new ResizeObserver(() => {
        calculateHeight();
      });

      const root = document.getElementById('root');
      if (root) {
        resizeObserver.observe(root);
        calculateHeight();
      }
      
      return () => {
        resizeObserver.disconnect();
        clearInterval(interval);
      };
    }
  }, [searchParams, loading, configs]);

  const handleGoogleLogin = async () => {
    setIsAuthenticating(true);
    try {
      // Force prompt=consent to ensure we ALWAYS get a refresh_token from Google
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          scopes: 'https://www.googleapis.com/auth/drive.readonly',
          redirectTo: window.location.origin + '/portal-transparencia?type=google_auth',
          skipBrowserRedirect: false
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error Google OAuth:', error);
      toast.error('Erro ao iniciar autenticação Google');
      setIsAuthenticating(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from('transparency_configs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setConfigs(data || []);
    } catch (error) {
      console.error('Error fetching configs:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleAddConfig = async () => {
    if (!newFolderId || !newLabel) {
      toast.error('Preencha todos os campos');
      return;
    }

    // Extract ID if a full URL was pasted
    let folderId = newFolderId.trim();
    if (folderId.includes('drive.google.com')) {
      const match = folderId.match(/\/folders\/([a-zA-Z0-9_-]+)/);
      if (match) {
        folderId = match[1];
      }
    } else if (folderId.includes('?')) {
      // Remove query parameters like ?hl=pt-br
      folderId = folderId.split('?')[0];
    }

    try {
      const { error } = await supabase
        .from('transparency_configs')
        .insert([{ folder_id: folderId, label: newLabel }]);
      
      if (error) throw error;
      
      toast.success('Configuração adicionada');
      setNewFolderId('');
      setNewLabel('');
      setIsAdding(false);
      fetchConfigs();
    } catch (error: any) {
      console.error('Error adding config:', error);
      toast.error('Erro ao salvar configuração: ' + (error.message || 'Erro desconhecido'));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('transparency_configs')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Configuração removida');
      fetchConfigs();
    } catch (error) {
      console.error('Error deleting config:', error);
      toast.error('Erro ao remover configuração');
    }
  };

  const copyEmbedCode = (id: string) => {
    const embedUrl = `${window.location.origin}/portal-transparencia?id=${id}&embed=true`;
    const embedCode = `
<iframe id="iframe-${id}" src="${embedUrl}" width="100%" frameborder="0" scrolling="no" style="overflow:hidden;"></iframe>
<script>
  window.addEventListener('message', function(e) {
    if (e.data.type === 'resize-iframe' && e.data.height) {
      document.getElementById('iframe-${id}').style.height = e.data.height + 'px';
    }
  }, false);
</script>`.trim();
    
    navigator.clipboard.writeText(embedCode);
    setCopiedId(id);
    toast.success('Código embed inteligente copiado!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isEmbed = searchParams.get('embed') === 'true';
  const embedId = searchParams.get('id');

  if (!isEmbed && !isAdmin && user?.email !== 'mkt@anabrasil.org' && user?.email !== 'transparencia@anabrasil.org' && user?.email !== 'contato@anabrasil.org') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <h1 className="text-2xl font-bold text-destructive">Acesso Restrito</h1>
        <p className="text-muted-foreground">Somente administradores podem acessar esta página.</p>
      </div>
    );
  }

  const filteredConfigs = embedId ? configs.filter(c => c.id === embedId) : configs;

  if (isEmbed) {
    return (
      <div className="p-0 bg-transparent w-full overflow-hidden m-0">
        {loading ? (
          <div className="flex justify-center py-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filteredConfigs.length === 0 ? (
          <div className="p-2 text-center text-muted-foreground text-sm">Pasta não encontrada ou não configurada.</div>
        ) : (
          <div className="flex flex-col gap-0 w-full m-0 p-0">
            {filteredConfigs.map((config) => (
              <div key={config.id} className="bg-card border rounded-lg overflow-hidden w-full m-0">
                <div className="bg-muted/50 p-1.5 border-b flex items-center gap-2">
                  <Folder className="h-4 w-4 text-amber-500 fill-amber-500" />
                  <span className="text-sm font-medium">{config.label}</span>
                </div>
                <div className="p-4 flex flex-col gap-1 w-full overflow-visible">
                  <DriveExplorer folderId={config.folder_id} folderName={config.label} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      {hasGoogleAuth ? (
        <Card className="mb-8 border-green-200 bg-green-50/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-green-800 text-lg">Google Drive Conectado</CardTitle>
                  <CardDescription className="text-green-700">
                    A integração global está ativa e os arquivos estão sendo sincronizados.
                  </CardDescription>
                </div>
              </div>
              <Button 
                variant="outline"
                size="sm"
                onClick={handleGoogleLogin} 
                disabled={isAuthenticating}
                className="border-green-200 hover:bg-green-100 text-green-700"
              >
                {isAuthenticating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Settings className="mr-2 h-4 w-4" />}
                Alterar Conta
              </Button>
            </div>
          </CardHeader>
        </Card>
      ) : (
        <Card className="mb-8 border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-800 flex items-center gap-2">
              <LogIn className="h-5 w-5" /> Conexão Necessária
            </CardTitle>
            <CardDescription className="text-amber-700">
              Para visualizar os arquivos do Google Drive em tempo real, um administrador precisa autorizar o acesso uma única vez para todo o sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleGoogleLogin} 
              disabled={isAuthenticating}
              className="bg-[#4285F4] hover:bg-[#357abd]"
            >
              {isAuthenticating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
              Conectar Google Drive (Global)
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portal da Transparência</h1>
          <p className="text-muted-foreground">Gerencie as pastas do Google Drive exibidas no portal.</p>
        </div>
        
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Nova Pasta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Pasta do Google Drive</DialogTitle>
              <DialogDescription>
                Insira o ID da pasta do Google Drive e um nome para identificação.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome / Rótulo</label>
                <Input 
                  placeholder="Ex: Documentos Financeiros 2024" 
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Google Drive Folder ID</label>
                <Input 
                  placeholder="ID da pasta (encontrado na URL do Drive)" 
                  value={newFolderId}
                  onChange={(e) => setNewFolderId(e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground">
                  Dica: O ID é a parte final da URL: drive.google.com/drive/folders/<strong>ID_AQUI</strong>
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAdding(false)}>Cancelar</Button>
              <Button onClick={handleAddConfig}>Salvar Configuração</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : configs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Folder className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
            <h3 className="text-lg font-medium">Nenhuma pasta configurada</h3>
            <p className="text-muted-foreground mb-6">Comece adicionando uma pasta do Google Drive para exibir no portal.</p>
            <Button variant="outline" onClick={() => setIsAdding(true)}>Configurar primeira pasta</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredConfigs.map((config) => (
            <Card key={config.id} className="overflow-hidden">
              <CardHeader className="bg-muted/30 pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{config.label}</CardTitle>
                    <CardDescription className="font-mono text-xs mt-1">ID: {config.folder_id}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-2"
                      onClick={() => copyEmbedCode(config.id)}
                    >
                      {copiedId === config.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      Embed
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(config.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 border-t">
                <div className="p-6">
                  <div className="bg-card border rounded-lg overflow-hidden">
                    <div className="bg-muted/50 p-1.5 border-b flex items-center gap-2">
                      <Folder className="h-4 w-4 text-amber-500 fill-amber-500" />
                      <span className="text-sm font-medium">{config.label}</span>
                    </div>
                    {/* Simulated Drive Explorer */}
                    <div className="p-4 min-h-[200px] flex flex-col gap-1">
                      <DriveExplorer folderId={config.folder_id} folderName={config.label} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

const FileViewerDialog = ({ item, isOpen, onClose }: { item: DriveItem, isOpen: boolean, onClose: () => void }) => {
  const driveUrl = `https://drive.google.com/file/d/${item.id}/preview`;
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="max-w-none w-screen h-screen p-0 m-0 overflow-hidden flex flex-col rounded-none border-none shadow-none z-[9999] top-0 left-0 translate-x-0 translate-y-0 sm:rounded-none"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <style dangerouslySetInnerHTML={{ __html: `
          /* Remove o fundo escuro (overlay) e o botão de fechar padrão do Radix UI */
          [data-radix-portal] > [data-state=open].fixed.inset-0.z-50.bg-black\\/80 { 
            display: none !important;
          }
          [data-radix-portal] button[class*="absolute right-4 top-4"] {
            display: none !important;
          }
        ` }} />
        <DialogHeader className="p-2 border-b flex flex-row items-center justify-between space-y-0 bg-background h-10 shrink-0">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <FileIcon mimeType={item.mimeType} className="h-4 w-4 shrink-0" />
            <DialogTitle className="text-sm font-medium truncate max-w-[70vw] leading-tight">{item.name}</DialogTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-7 px-2 text-xs" asChild>
              <a href={`https://drive.google.com/uc?export=download&id=${item.id}`} target="_blank" rel="noreferrer">
                <Download className="h-3.5 w-3.5 mr-1" /> Download
              </a>
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 bg-white relative w-full h-full">
          <iframe 
            src={driveUrl} 
            className="w-full h-full border-none absolute inset-0" 
            title={item.name}
            allow="autoplay; fullscreen"
            allowFullScreen
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

const FileIcon = ({ mimeType, className }: { mimeType: string, className?: string }) => {
  if (mimeType === 'application/vnd.google-apps.folder') {
    return <Folder className={cn("text-amber-500 fill-amber-500", className)} />;
  }
  
  if (mimeType === 'application/pdf') {
    return <FileText className={cn("text-red-500", className)} />;
  }
  
  if (mimeType.includes('word') || mimeType.includes('officedocument.wordprocessingml')) {
    return <FileCode className={cn("text-blue-600", className)} />;
  }
  
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet') || mimeType.includes('officedocument.spreadsheetml')) {
    return <FileSpreadsheet className={cn("text-emerald-600", className)} />;
  }
  
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) {
    return <FileText className={cn("text-orange-600", className)} />;
  }
  
  if (mimeType.startsWith('image/')) {
    return <FileImage className={cn("text-purple-500", className)} />;
  }
  
  if (mimeType.startsWith('video/')) {
    return <FileVideo className={cn("text-slate-700", className)} />;
  }
  
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('compressed')) {
    return <FileArchive className={cn("text-amber-700", className)} />;
  }

  return <File className={cn("text-slate-400", className)} />;
};

// Component to explore the drive folder structure
const DriveExplorer = ({ folderId, folderName }: { folderId: string, folderName: string }) => {
  const [items, setItems] = useState<DriveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke('google-drive-proxy', {
        body: { action: 'list_files', folderId }
      });

      if (error) throw error;
      if (data.error === 'google_auth_required') {
        setError('authentication_required');
        return;
      }
      
      setItems(data.files || []);
    } catch (err: any) {
      console.error('Error fetching drive files:', err);
      setError(err.message || 'Erro ao carregar arquivos');
    } finally {
      setLoading(false);
    }
  }, [folderId]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  if (loading) return <div className="flex items-center justify-center p-8"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  
  if (error === 'authentication_required') {
    return (
      <div className="p-8 text-center border rounded-lg bg-muted/20">
        <p className="text-sm text-muted-foreground mb-4">Autenticação com Google Drive necessária para visualizar esta pasta.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-destructive">
        <p className="text-sm">{error}</p>
        <Button variant="ghost" size="sm" onClick={fetchFiles} className="mt-2">Tentar novamente</Button>
      </div>
    );
  }

  if (items.length === 0) {
    return <div className="p-8 text-center text-muted-foreground text-sm">Nenhum arquivo encontrado nesta pasta.</div>;
  }

  return (
    <div className="space-y-1">
      {items.map(item => (
        <DriveItemComponent key={item.id} item={item} depth={0} />
      ))}
    </div>
  );
};

const DriveItemComponent = ({ item, depth }: { item: DriveItem, depth: number }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [children, setChildren] = useState<DriveItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewingFile, setViewingFile] = useState(false);
  const isFolder = item.mimeType === 'application/vnd.google-apps.folder';

  const handleClick = async () => {
    if (isFolder) {
      if (!isOpen && children.length === 0) {
        setLoading(true);
        try {
          const { data, error } = await supabase.functions.invoke('google-drive-proxy', {
            body: { action: 'list_files', folderId: item.id }
          });
          if (error) throw error;
          setChildren(data.files || []);
          setIsOpen(true);
        } catch (err) {
          console.error('Error fetching subfolder:', err);
          toast.error('Erro ao abrir pasta');
        } finally {
          setLoading(false);
        }
      } else {
        setIsOpen(!isOpen);
      }
    } else {
      setViewingFile(true);
    }
  };

  return (
    <div className="flex flex-col">
      <div 
        className={cn(
          "flex items-center gap-2 p-2 rounded-md transition-colors cursor-pointer group",
          isFolder ? "hover:bg-muted font-medium" : "hover:bg-muted/50"
        )}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
        onClick={handleClick}
      >
        <div className="flex items-center gap-2">
          {isFolder && (
            isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <FileIcon mimeType={item.mimeType} className="h-4 w-4" />
        </div>
        
        <span className="text-sm flex-1 truncate">{item.name}</span>
        
        {!isFolder && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" title="Tela Cheia" onClick={(e) => { e.stopPropagation(); setViewingFile(true); }}>
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" title="Janela Tela Cheia" asChild onClick={(e) => e.stopPropagation()}>
              <a href={`https://drive.google.com/file/d/${item.id}/preview`} target="_blank" rel="noreferrer">
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" title="Download" asChild onClick={(e) => e.stopPropagation()}>
              <a href={`https://drive.google.com/uc?export=download&id=${item.id}`} target="_blank" rel="noreferrer">
                <Download className="h-3.5 w-3.5" />
              </a>
            </Button>
          </div>
        )}
      </div>
      
      {!isFolder && (
        <FileViewerDialog 
          item={item} 
          isOpen={viewingFile} 
          onClose={() => setViewingFile(false)} 
        />
      )}
      
      {isOpen && (
        <div className="flex flex-col">
          {loading ? (
            <div className="p-2 ml-8 flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Carregando...
            </div>
          ) : (
            children.map(child => (
              <DriveItemComponent key={child.id} item={child} depth={depth + 1} />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default TransparencyPage;
