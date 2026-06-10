import React from 'react';
import { ShieldAlert, Terminal, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AdminToolboxPage() {
  return (
    <div className="container mx-auto py-10 px-4 animate-in fade-in duration-500">
      <div className="flex flex-col gap-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Ferramentas de Implementação</h1>
            <p className="text-muted-foreground">Área restrita para administradores e desenvolvedores.</p>
          </div>
        </div>

        <Alert variant="destructive" className="bg-destructive/5 border-destructive/20">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Área Restrita</AlertTitle>
          <AlertDescription>
            Esta página não é visível nos menus de navegação comuns e contém ferramentas de configuração do sistema.
          </AlertDescription>
        </Alert>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Terminal className="h-5 w-5 text-primary" />
                <CardTitle>Console de Desenvolvimento</CardTitle>
              </div>
              <CardDescription>
                Espaço reservado para implementação de novas ferramentas e scripts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-black/90 p-4 font-mono text-sm text-green-400 min-h-[150px]">
                <p>$ system ready</p>
                <p>$ waiting for implementation...</p>
                <p className="animate-pulse">_</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Configurações de Ferramentas</CardTitle>
              <CardDescription>
                Gerencie os parâmetros das ferramentas em desenvolvimento.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-md border border-dashed border-muted-foreground/20 text-center text-muted-foreground text-sm">
                Nenhuma ferramenta ativa para configuração.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
