import { useState, useMemo, useEffect } from 'react';
import { useSheetIntegration } from '@/hooks/useSheetIntegration';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { ArrowUp, ArrowDown, RefreshCw, Eye, AlertTriangle, CheckCircle2, X } from 'lucide-react';

const SYSTEM_FIELDS = [
  { value: 'title', label: 'Título do Evento' },
  { value: 'description', label: 'Descrição' },
  { value: 'unit', label: 'Unidade' },
  { value: 'event_type', label: 'Tipo de Evento' },
  { value: 'start_datetime', label: 'Data/Hora Início' },
  { value: 'end_datetime', label: 'Data/Hora Fim' },
  { value: 'location', label: 'Local' },
  { value: 'status', label: 'Status' },
  { value: 'notes', label: 'Observações' },
  { value: 'marketing_request', label: 'Solicitação de Marketing' },
  { value: 'partner_involved', label: 'Parceiro Envolvido' },
  { value: 'partner_name', label: 'Nome do Parceiro' },
  { value: 'partner_type', label: 'Tipo de Parceiro' },
  { value: 'created_by', label: 'Criado por (email)' },
  { value: 'attachments', label: 'Anexos (URLs)' },
] as const;

type SystemField = typeof SYSTEM_FIELDS[number]['value'];

interface MappingEntry {
  sheetField: string;
  systemField: SystemField | '';
  order: number;
  separator: string;
}

export default function MappingPage() {
  const { rows, headers, loading, error, refetch } = useSheetIntegration();
  const [mappings, setMappings] = useState<MappingEntry[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // Initialize mappings when headers load
  useEffect(() => {
    if (headers.length > 0 && mappings.length === 0) {
      setMappings(headers.map((h, i) => ({
        sheetField: h,
        systemField: '',
        order: i,
        separator: ' - ',
      })));
    }
  }, [headers, mappings.length]);

  const updateMapping = (index: number, field: Partial<MappingEntry>) => {
    setMappings(prev => prev.map((m, i) => i === index ? { ...m, ...field } : m));
  };

  // Group mappings by system field to detect concatenations
  const groupedBySystem = useMemo(() => {
    const groups: Record<string, MappingEntry[]> = {};
    mappings.filter(m => m.systemField).forEach(m => {
      if (!groups[m.systemField]) groups[m.systemField] = [];
      groups[m.systemField].push(m);
    });
    // Sort each group by order
    Object.values(groups).forEach(g => g.sort((a, b) => a.order - b.order));
    return groups;
  }, [mappings]);

  // Unmapped fields
  const unmappedFields = useMemo(
    () => mappings.filter(m => !m.systemField).map(m => m.sheetField),
    [mappings]
  );

  // Fields with concatenation (>1 source)
  const concatenatedFields = useMemo(
    () => Object.entries(groupedBySystem).filter(([, v]) => v.length > 1),
    [groupedBySystem]
  );

  // Build preview data
  const previewData = useMemo(() => {
    if (!showPreview) return [];
    return rows.slice(0, 5).map(row => {
      const result: Record<string, string> = {};
      Object.entries(groupedBySystem).forEach(([sysField, entries]) => {
        const sorted = [...entries].sort((a, b) => a.order - b.order);
        const values = sorted
          .map(e => row[e.sheetField] ?? '')
          .filter(v => v.length > 0);
        const sep = sorted[0]?.separator || ' - ';
        result[sysField] = values.join(sep);
      });
      return result;
    });
  }, [showPreview, rows, groupedBySystem]);

  const moveOrder = (index: number, direction: 'up' | 'down') => {
    setMappings(prev => {
      const updated = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      
      if (targetIndex >= 0 && targetIndex < updated.length) {
        // Swap elements in the array
        const temp = updated[index];
        updated[index] = updated[targetIndex];
        updated[targetIndex] = temp;
        
        // Update the 'order' property to match the new array position
        return updated.map((m, i) => ({ ...m, order: i }));
      }
      return updated;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2">Carregando dados da planilha...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Erro: {error}</p>
            <Button onClick={refetch} variant="outline" className="mt-4">Tentar novamente</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8 max-w-[1200px] mx-auto">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Mapeamento de Campos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {rows.length} registros encontrados • {headers.length} campos na planilha
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button variant="outline" size="sm" onClick={refetch} className="shadow-sm">
            <RefreshCw className="h-4 w-4 mr-2" /> Recarregar
          </Button>
          <Button size="sm" onClick={() => setShowPreview(!showPreview)} className="shadow-sm">
            <Eye className="h-4 w-4 mr-2" /> {showPreview ? 'Ocultar' : 'Visualizar'} Preview
          </Button>
        </div>
      </div>

      {/* Mapping Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Campos da Planilha → Campos do Sistema</CardTitle>
          <CardDescription>
            Selecione para qual campo do sistema cada coluna da planilha deve ser mapeada.
            Múltiplos campos podem ir para o mesmo destino (serão concatenados).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px] w-[40%]">Campo da Planilha (X)</TableHead>
                  <TableHead className="min-w-[180px] w-[30%]">Campo do Sistema (Y)</TableHead>
                  <TableHead className="min-w-[80px] w-[10%]">Ordem</TableHead>
                  <TableHead className="min-w-[100px] w-[15%]">Separador</TableHead>
                  <TableHead className="w-[5%]"></TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {mappings.map((mapping, idx) => (
                <TableRow key={mapping.sheetField}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate max-w-[300px]" title={mapping.sheetField}>
                        {mapping.sheetField}
                      </span>
                      {rows[0] && (
                        <span className="text-xs text-muted-foreground truncate max-w-[150px]" title={rows[0][mapping.sheetField]}>
                          ex: {rows[0][mapping.sheetField]?.substring(0, 40) || '(vazio)'}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={mapping.systemField || 'none'}
                      onValueChange={(v) => updateMapping(idx, { systemField: v === 'none' ? '' : v as SystemField })}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Não mapeado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— Não mapeado —</SelectItem>
                        {SYSTEM_FIELDS.map(f => (
                          <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className="text-sm w-6 text-center">{mapping.order + 1}</span>
                      <div className="flex flex-col">
                        <button onClick={() => moveOrder(idx, 'up')} className="p-0.5 hover:text-primary">
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <button onClick={() => moveOrder(idx, 'down')} className="p-0.5 hover:text-primary">
                          <ArrowDown className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      value={mapping.separator}
                      onChange={(e) => updateMapping(idx, { separator: e.target.value })}
                      className="h-8 text-sm w-20"
                      placeholder=" - "
                    />
                  </TableCell>
                  <TableCell>
                    {mapping.systemField && (
                      <button onClick={() => updateMapping(idx, { systemField: '' })} className="p-1 hover:text-destructive">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Concatenation Info */}
      {concatenatedFields.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-status-confirmed" />
              Campos Concatenados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {concatenatedFields.map(([sysField, entries]) => {
              const label = SYSTEM_FIELDS.find(f => f.value === sysField)?.label || sysField;
              const sep = entries[0]?.separator || ' - ';
              return (
                <div key={sysField} className="p-3 rounded-md bg-muted/50">
                  <p className="font-medium text-sm">{label}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {entries.map(e => `"${e.sheetField}"`).join(` ${sep} `)}
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Unmapped Fields */}
      {unmappedFields.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-status-pending" />
              Campos Não Utilizados ({unmappedFields.length})
            </CardTitle>
            <CardDescription>
              Estes campos da planilha não estão mapeados para nenhum campo do sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {unmappedFields.map(f => (
                <Badge key={f} variant="outline" className="text-xs">{f}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview */}
      {showPreview && previewData.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Preview dos Dados Mapeados</CardTitle>
            <CardDescription>Mostrando os primeiros 5 registros com o mapeamento aplicado.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    {Object.keys(groupedBySystem).map(sysField => (
                      <TableHead key={sysField}>
                        {SYSTEM_FIELDS.find(f => f.value === sysField)?.label || sysField}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                      {Object.keys(groupedBySystem).map(sysField => (
                        <TableCell key={sysField}>
                          <span className="text-sm truncate block max-w-[200px]" title={row[sysField]}>
                            {row[sysField] || <span className="text-muted-foreground italic">vazio</span>}
                          </span>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
