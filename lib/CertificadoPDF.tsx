import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { CertificateData } from './types';

// Estilos del PDF inspirados en el diseño de IT School
const styles = StyleSheet.create({
  page: {
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
    borderBottom: '3px solid #4F46E5',
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4F46E5',
    marginBottom: 10,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  certificationText: {
    fontSize: 18,
    color: '#374151',
    textAlign: 'center',
    marginTop: 30,
    marginBottom: 10,
  },
  studentName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 20,
    borderBottom: '2px solid #E5E7EB',
    paddingBottom: 10,
  },
  completionText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 5,
  },
  courseName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4F46E5',
    textAlign: 'center',
    marginBottom: 10,
  },
  courseDetails: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 30,
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 50,
    paddingTop: 20,
    borderTop: '1px solid #E5E7EB',
  },
  signatureBlock: {
    width: '45%',
    textAlign: 'center',
  },
  signatureLine: {
    borderTop: '2px solid #374151',
    marginBottom: 10,
    paddingTop: 10,
  },
  signatureName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 5,
  },
  signatureRole: {
    fontSize: 11,
    color: '#6B7280',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 15,
    borderTop: '1px solid #E5E7EB',
  },
  qrSection: {
    alignItems: 'center',
  },
  qrCode: {
    width: 80,
    height: 80,
    marginBottom: 5,
  },
  qrText: {
    fontSize: 8,
    color: '#6B7280',
  },
  footerInfo: {
    flex: 1,
    paddingLeft: 20,
  },
  footerText: {
    fontSize: 9,
    color: '#6B7280',
    marginBottom: 3,
  },
  scoreSection: {
    textAlign: 'center',
    marginTop: 20,
    padding: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  scoreText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: 'bold',
  },
  gradientBar: {
    height: 8,
    background: 'linear-gradient(90deg, #4F46E5 0%, #7C3AED 100%)',
    marginBottom: 20,
  },
});

interface CertificadoPDFProps {
  data: CertificateData;
  qrCodeDataUrl: string;
}

/**
 * Componente PDF del certificado con diseño inspirado en IT School
 * Genera un PDF profesional con:
 * - Encabezado con gradiente azul-morado
 * - Nombre del estudiante destacado
 * - Detalles del curso y duración
 * - Código QR para validación
 * - Firma del instructor
 */
export const CertificadoPDF: React.FC<CertificadoPDFProps> = ({ data, qrCodeDataUrl }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Header con branding */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>IT SCHOOL</Text>
          <Text style={styles.headerSubtitle}>
            Instituto de Tecnología y Desarrollo de Software
          </Text>
        </View>

        {/* Barra de gradiente decorativa */}
        <View style={styles.gradientBar} />

        {/* Texto de certificación */}
        <Text style={styles.certificationText}>
          CERTIFICA QUE
        </Text>

        {/* Nombre del estudiante */}
        <Text style={styles.studentName}>
          {data.studentName}
        </Text>

        {/* Texto de completitud */}
        <Text style={styles.completionText}>
          ha completado satisfactoriamente el curso de
        </Text>

        {/* Nombre del curso */}
        <Text style={styles.courseName}>
          {data.courseName}
        </Text>

        {/* Detalles del curso */}
        <Text style={styles.courseDetails}>
          Duración: {data.duration} • Fecha de finalización: {formatDate(data.completionDate)}
        </Text>

        {/* Puntaje obtenido */}
        <View style={styles.scoreSection}>
          <Text style={styles.scoreText}>
            Calificación Final: {data.score} puntos
          </Text>
        </View>

        {/* Firma del instructor */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine}>
              <Text style={styles.signatureName}>{data.instructorName}</Text>
              <Text style={styles.signatureRole}>Instructor del Curso</Text>
            </View>
          </View>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine}>
              <Text style={styles.signatureName}>IT School</Text>
              <Text style={styles.signatureRole}>Dirección Académica</Text>
            </View>
          </View>
        </View>

        {/* Footer con QR y detalles */}
        <View style={styles.footer}>
          <View style={styles.qrSection}>
            <Image src={qrCodeDataUrl} style={styles.qrCode} />
            <Text style={styles.qrText}>Escanear para validar</Text>
          </View>
          <View style={styles.footerInfo}>
            <Text style={styles.footerText}>
              Certificado ID: {data.token.substring(0, 16).toUpperCase()}
            </Text>
            <Text style={styles.footerText}>
              Fecha de emisión: {formatDate(data.generatedAt)}
            </Text>
            <Text style={styles.footerText}>
              Validar en: {data.validationUrl}
            </Text>
            <Text style={styles.footerText}>
              © {new Date().getFullYear()} IT School - www.itschool.com.ar
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
