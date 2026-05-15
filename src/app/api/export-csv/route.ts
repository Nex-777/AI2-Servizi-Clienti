import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const csvContent = formData.get('csvContent') as string;
    const filename = formData.get('filename') as string;

    if (!csvContent || !filename) {
      return new Response('Missing data', { status: 400 });
    }

    // Aggiungiamo il BOM UTF-8 se non è già presente
    const contentWithBom = csvContent.startsWith('\ufeff') 
      ? csvContent 
      : '\ufeff' + csvContent;

    return new Response(contentWithBom, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Export API Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
