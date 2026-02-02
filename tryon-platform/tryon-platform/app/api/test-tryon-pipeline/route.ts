import { NextRequest, NextResponse } from 'next/server';
import { geminiService } from '@/lib/gemini';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Use existing test files
    const subjectPath = path.join(process.cwd(), 'public/uploads/73111cb1-3c60-4f72-bfb0-3dcaeef0b146/subject_0_test_subject.jpg');
    const glassesPath = path.join(process.cwd(), 'public/uploads/projects/a62d4df7-0068-442f-937f-f4561c0114f4/glasses_main.jpg');
    const taskId = `test-nano-banana-${Date.now()}`;

    console.log('='.repeat(60));
    console.log('Testing gemini-2.5-flash-image (Nano Banana) Pipeline');
    console.log('='.repeat(60));
    console.log('Subject:', subjectPath);
    console.log('Glasses:', glassesPath);
    console.log('Task ID:', taskId);
    console.log('='.repeat(60));

    const startTime = Date.now();

    const result = await geminiService.processTryOn(
      subjectPath,
      [glassesPath],
      {
        guidance: 0.6,
        refStrength: 0.85,
        lightingWeight: 0.7,
        reflectionWeight: 0.8,
        colorMatchWeight: 0.15,
        seed: 12345
      },
      taskId,
      undefined
    );

    const duration = Date.now() - startTime;

    console.log('='.repeat(60));
    console.log('Pipeline Test Complete!');
    console.log('Duration:', duration, 'ms');
    console.log('Result:', result.resultImagePath);
    console.log('Report:', JSON.stringify(result.report, null, 2));
    console.log('='.repeat(60));

    return NextResponse.json({
      success: true,
      duration,
      resultImagePath: result.resultImagePath,
      resultUrl: result.resultImagePath?.replace(process.cwd(), '').replace('/public', ''),
      report: result.report
    });

  } catch (error: any) {
    console.error('='.repeat(60));
    console.error('Pipeline Test Failed!');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('='.repeat(60));

    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 5)
    }, { status: 500 });
  }
}
