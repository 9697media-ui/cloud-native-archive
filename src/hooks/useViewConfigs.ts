import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ViewConfigs {
  enable_role_based_view: boolean;
  role_defaults: Record<string, string[]>;
}

export function useViewConfigs() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: configs, isLoading } = useQuery({
    queryKey: ["view-configs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("view_configs")
        .select("*");

      if (error) throw error;

      const configMap: Partial<ViewConfigs> = {};
      data.forEach((item) => {
        if (item.key === "enable_role_based_view") {
          configMap.enable_role_based_view = item.value === true || item.value === "true";
        } else if (item.key === "role_defaults") {
          configMap.role_defaults = item.value as Record<string, string[]>;
        }
      });

      return configMap as ViewConfigs;
    },
  });

  const updateConfig = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const { error } = await supabase
        .from("view_configs")
        .update({ value, updated_at: new Date().toISOString() })
        .eq("key", key);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["view-configs"] });
      toast({ title: "Configuração atualizada" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    configs,
    isLoading,
    updateConfig,
  };
}
