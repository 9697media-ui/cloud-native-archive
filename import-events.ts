
import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const csvContent = readFileSync('spreadsheet.csv', 'utf-8');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
  });

  console.log(`Found ${records.length} records in CSV.`);

  // 1. Delete all existing events
  const { error: deleteError } = await supabase
    .from('events')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

  if (deleteError) {
    console.error('Error deleting events:', deleteError);
    return;
  }
  console.log('Deleted all existing events.');

  const eventsToInsert = records.map((record: any) => {
    const title = record['NOME DO EVENTO, SE HOUVER:'] || 'Evento sem título';
    const dateStr = record['DATA DO EVENTO:'];
    const timeStr = record['HORÁRIO DO EVENTO:'];
    
    let start_datetime: string | null = null;
    if (dateStr) {
      const [day, month, year] = dateStr.split('/');
      const time = timeStr && timeStr.includes(':') ? timeStr : '08:00';
      // Assume DD/MM/YYYY format
      start_datetime = `${year}-${month}-${day}T${time}:00Z`;
    }

    const description = record['DESCREVA BREVEMENTE A PROPOSTA E A PROGRAMAÇÃO DO EVENTO:'] || '';
    const visibility = record['O EVENTO SERÁ:']?.toLowerCase().includes('externo') ? 'público' : 'interno';
    const marketing_request = record['COBERTURA DO MARKETING NO DIA DO EVENTO:']?.toLowerCase().includes('irá precisar');
    
    const attachmentUrl = record['ADICIONE ALGUM ARQUIVO/ANEXO, CASO HAJA NECESSIDADE:'];
    const attachments = attachmentUrl ? [attachmentUrl] : [];

    return {
      title,
      description,
      start_datetime,
      end_datetime: start_datetime, // Default to same as start if not specified
      visibility,
      marketing_request,
      attachments,
      created_by: 'mkt@anabrasil.org',
      status: 'confirmado',
      unit: 'Evento Geral do Grupo', // Default unit if not specified
      event_type: 'outro'
    };
  });

  const { error: insertError } = await supabase
    .from('events')
    .insert(eventsToInsert);

  if (insertError) {
    console.error('Error inserting events:', insertError);
  } else {
    console.log(`Successfully inserted ${eventsToInsert.length} events.`);
  }
}

main().catch(console.error);
