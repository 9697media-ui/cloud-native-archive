ALTER TABLE public.widget_templates
DROP CONSTRAINT IF EXISTS widget_templates_type_check;

ALTER TABLE public.widget_templates
ADD CONSTRAINT widget_templates_type_check
CHECK (type IN ('whatsapp', 'banner', 'menu', 'gateway'));