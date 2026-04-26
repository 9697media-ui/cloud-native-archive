## Objetivo

Reintroduzir o quadro **"Legenda e Funcionamento do Sistema"** (mostrado na imagem de referência) dentro da aba **Configurações de Visualização** (`/usuarios` → aba "Visualização"), no formato **card expansível**, seguindo o mesmo padrão visual do card "Solicitações de Aprovação" já existente na página.

## Onde inserir

Arquivo: `src/pages/UsersPage.tsx`

Posição: dentro do `<CardContent>` do card **"Configuração de Visualização por Perfil"** (linha 898), logo **após o bloco do toggle "Sistema de Restrição por Cargo"** (que termina na linha 937) e **antes do Alert "Configurações Inativas"** (linha 940).

Assim a legenda aparece junto às configurações que ela explica, dentro do mesmo card.

## Formato — card expansível (padrão "Solicitações de Aprovação")

Seguir exatamente o padrão usado nas linhas 730-753:

1. **Botão de cabeçalho** (`<button>`) com:
   - Ícone à esquerda (`Clock` em círculo `bg-primary/10`)
   - Título: "Legenda e Funcionamento do Sistema"
   - Subtítulo: "Clique para ver como funciona o sistema de restrições e os níveis de permissão"
   - `ChevronDown` à direita com rotação animada (`rotate-180` quando expandido)
   - Estado controlado por novo `useState` → `legendExpanded` (default `false`)

2. **Conteúdo expandido** (renderizado quando `legendExpanded === true`):
   - `<Card className="border-primary/20 bg-primary/5 animate-in slide-in-from-top-2 duration-300">`
   - Conteúdo idêntico ao da imagem de referência:

     **Bloco superior — grid 2 colunas:**
     - **Sistema por Cargo ATIVO** (bullet verde):
       - "O acesso às unidades é determinado **exclusivamente** pelo cargo do usuário."
       - "Qualquer restrição personalizada individual será **ignorada** enquanto este modo estiver ativo."
       - *Exemplo*: Um "Gestor de Unidade" da DIC terá acesso apenas à DIC, mesmo que tenha restrições manuais.
     - **Sistema por Cargo INATIVO** (bullet laranja):
       - "O sistema prioriza as **Restrições Personalizadas** de cada usuário."
       - "Caso o usuário não possua restrição manual, o acesso é total ou padrão do sistema."
       - *Exemplo*: Um "Visualizador" pode ser configurado para ver especificamente as unidades DIC e DIP simultaneamente.

     **Bloco inferior — Definição dos Níveis de Permissão** (separador + grid 4 colunas):
     - **Admin Geral**: Acesso total e irrestrito. Único com poder de gerenciar usuários e aprovar novos acessos.
     - **Gestor de Unidade**: Responsável pela gestão da sua unidade. Pode criar/editar eventos e aprovar usuários (com aviso).
     - **Usuário Padrão**: Perfil operacional focado na visualização e acompanhamento dos eventos de sua unidade de atuação.
     - **Visualizador**: Acesso somente leitura (Read-only). Destinado apenas para consulta de informações e calendário.

## Estado adicional

Adicionar perto dos outros `useState` da página:
```ts
const [legendExpanded, setLegendExpanded] = useState(false);
```

## Garantias

- **Não duplicar** — verifico que não existe outro bloco "Legenda e Funcionamento do Sistema" remanescente no arquivo (foi removido na iteração anterior).
- **Sem alterar lógica** — apenas inserção de UI estática informativa.
- **Ícones** já importados: `Clock`, `ChevronDown`, `ShieldCheck` — não precisa de novos imports.
- **Mantém estrutura JSX** balanceada do `CardContent` existente.
