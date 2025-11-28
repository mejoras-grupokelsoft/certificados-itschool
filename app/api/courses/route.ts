import { NextResponse } from 'next/server';
import { getAllCourses } from '@/lib/sheetsConfig';

export async function GET() {
  try {
    console.log('🔍 Fetching all courses from Google Sheets...');
    
    const courses = await getAllCourses();
    
    console.log(`✅ Found ${courses.length} courses`);
    
    return NextResponse.json({ 
      courses,
      count: courses.length 
    });
  } catch (error) {
    console.error('❌ Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Error al cargar los cursos' },
      { status: 500 }
    );
  }
}
