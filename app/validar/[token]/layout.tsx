import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { token: string } }): Promise<Metadata> {
  const token = params.token;
  
  // Intentar obtener información del certificado para metadata
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://certificados.itschool.com.ar';
    const response = await fetch(`${baseUrl}/api/certificate/validate/${token}`, {
      cache: 'no-store'
    });
    
    if (response.ok) {
      const data = await response.json();
      
      return {
        title: `Certificado de ${data.studentName} - IT School`,
        description: `${data.studentName} completó exitosamente el curso "${data.courseName}" en IT School - Educación IT`,
        openGraph: {
          title: `Certificado de ${data.studentName} - ${data.courseName}`,
          description: `${data.studentName} completó exitosamente el curso "${data.courseName}" en IT School - Educación IT`,
          url: `${baseUrl}/validar/${token}`,
          siteName: 'IT School - Certificados',
          images: [
            {
              url: `${baseUrl}/api/og/${token}`,
              width: 1200,
              height: 630,
              alt: `Certificado de ${data.studentName} - ${data.courseName}`,
            }
          ],
          locale: 'es_AR',
          type: 'website',
        },
        twitter: {
          card: 'summary_large_image',
          title: `Certificado de ${data.studentName} - ${data.courseName}`,
          description: `${data.studentName} completó exitosamente el curso "${data.courseName}" en IT School - Educación IT`,
          images: [`${baseUrl}/api/og/${token}`],
        },
      };
    }
  } catch (error) {
    console.error('Error generating metadata:', error);
  }
  
  // Metadata por defecto si falla
  return {
    title: 'Validación de Certificado - IT School',
    description: 'Verifica la autenticidad de un certificado de IT School - Educación IT',
    openGraph: {
      title: 'Certificado IT School',
      description: 'Certificado verificado de IT School - Educación IT',
      images: ['/Logo Original a color.svg'],
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
