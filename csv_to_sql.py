
import csv
import json

def escape_sql(val):
    if val is None:
        return 'NULL'
    return "'" + str(val).replace("'", "''") + "'"

with open('spreadsheet.csv', mode='r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    sql_commands = ["DELETE FROM public.events;"]
    
    for row in reader:
        title = row.get('NOME DO EVENTO, SE HOUVER:', 'Evento sem título')
        date_str = row.get('DATA DO EVENTO:', '')
        time_str = row.get('HORÁRIO DO EVENTO:', '')
        description = row.get('DESCREVA BREVEMENTE A PROPOSTA E A PROGRAMAÇÃO DO EVENTO:', '')
        
        # Date parsing
        start_datetime = 'NULL'
        if date_str:
            try:
                parts = date_str.split('/')
                if len(parts) == 3:
                    day, month, year = parts
                    time = time_str if time_str and ':' in time_str else '08:00'
                    start_datetime = f"'{year}-{month}-{day}T{time}:00Z'"
            except:
                pass
        
        visibility = 'público' if 'externo' in (row.get('O EVENTO SERÁ:', '') or '').lower() else 'interno'
        marketing_request = 'true' if 'irá precisar' in (row.get('COBERTURA DO MARKETING NO DIA DO EVENTO:', '') or '').lower() else 'false'
        
        attachment_url = row.get('ADICIONE ALGUM ARQUIVO/ANEXO, CASO HAJA NECESSIDADE:', '')
        attachments = json.dumps([attachment_url]) if attachment_url else '[]'
        
        fields = [
            ('title', escape_sql(title)),
            ('description', escape_sql(description)),
            ('start_datetime', start_datetime),
            ('end_datetime', start_datetime),
            ('visibility', escape_sql(visibility)),
            ('marketing_request', marketing_request),
            ('attachments', escape_sql(attachments)),
            ('created_by', escape_sql('mkt@anabrasil.org')),
            ('status', escape_sql('confirmado')),
            ('unit', escape_sql('Evento Geral do Grupo')),
            ('event_type', escape_sql('outro'))
        ]
        
        cols = ", ".join([f[0] for f in fields])
        vals = ", ".join([f[1] for f in fields])
        sql_commands.append(f"INSERT INTO public.events ({cols}) VALUES ({vals});")

with open('import.sql', 'w', encoding='utf-8') as f:
    f.write("\n".join(sql_commands))
