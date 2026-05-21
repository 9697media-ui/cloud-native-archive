-- Remover eventos de teste
DELETE FROM public.events 
WHERE title ILIKE '%teste%';

-- Reverter o deslocamento de 1 ano nas datas (voltando para 2025 conforme a planilha original para os registros antigos)
-- Nota: Isso só afeta os registros que foram movidos para 2026 erroneamente
UPDATE public.events 
SET 
  start_datetime = start_datetime - interval '1 year',
  end_datetime = end_datetime - interval '1 year'
WHERE start_datetime >= '2026-01-01' AND start_datetime < '2027-01-01';