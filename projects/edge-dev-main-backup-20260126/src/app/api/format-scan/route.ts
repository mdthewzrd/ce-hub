import { NextRequest, NextResponse } from 'next/server';
import { RenataAIAgentServiceV2 } from '../../../services/renataAIAgentServiceV2';
import { extractScannerLogic, generateParamPreservingSystemPrompt } from '../../../services/paramExtractionService';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 API Route: Processing format-scan request with Renata Final V');

    // Check if the request is form data (file upload) or JSON (pasted code)
    const contentType = request.headers.get('content-type') || '';

    let code: string = '';
    let filename: string = 'uploaded_scanner.py';
    let useAIAgent = true;

    if (contentType.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await request.formData();
      const file = formData.get('scanFile') as File || formData.get('file') as File;

      if (file) {
        console.log('📁 Processing uploaded file:', file.name);
        code = await file.text();
        filename = file.name;
      } else {
        return NextResponse.json(
          { success: false, error: 'No file provided' },
          { status: 400 }
        );
      }

      // Check if user wants AI formatting
      const formatterType = formData.get('formatterType') as string;
      useAIAgent = formatterType === 'smart' || formatterType === 'ai';
    } else {
      // Handle JSON request (pasted code)
      const body = await request.json();
      code = body.code || '';
      filename = body.filename || 'pasted_scanner.py';
      useAIAgent = body.useAIAgent !== false;

      if (!code) {
        return NextResponse.json(
          { success: false, error: 'No code provided' },
          { status: 400 }
        );
      }
    }

    console.log('📝 Code length:', code.length);
    console.log('🤖 Using Renata Final V with PARAM INTEGRITY preservation...');

    // 🎯 CRITICAL: Extract params and logic BEFORE transformation
    console.log('🔍 Extracting parameters and logic from uploaded scanner...');
    const extractedLogic = extractScannerLogic(code);
    console.log('✅ Extraction complete:');
    console.log(`   - Parameters: ${Object.keys(extractedLogic.params.raw_params || {}).length}`);
    console.log(`   - Detection logic: ${extractedLogic.detectPatternsLogic.length} chars`);
    console.log(`   - Helper functions: ${extractedLogic.helperFunctions.length}`);

    // Generate param-preserving system prompt
    const paramPreservingPrompt = generateParamPreservingSystemPrompt(extractedLogic);

    // Use Renata Final V for V31 transformation with param preservation
    const aiService = new RenataAIAgentServiceV2();
    const formattedCode = await aiService.generateWithCustomPrompt({
      prompt: `Transform this scanner code to EdgeDev v31 standards while preserving ALL original logic and parameters.

Scanner file: ${filename}

🎯 CRITICAL REQUIREMENTS:
1. Preserve the ${Object.keys(extractedLogic.params.raw_params || {}).length} extracted parameters
2. 移植 the original detection logic (${extractedLogic.detectPatternsLogic.length} chars) - THIS IS 3800+ CHARACTERS OF ACTUAL CODE
3. Use extracted helper functions (${extractedLogic.helperFunctions.length} functions)
4. Configure smart filters using the extracted parameters

⛔ DO NOT USE PLACEHOLDERS:
- DO NOT use "pass" in detect_patterns()
- DO NOT use "return data" or "return df" as the only logic
- DO NOT use comments like "TODO" or "placeholder"
- YOU MUST USE THE EXTRACTED 3800+ CHARACTERS OF DETECTION LOGIC PROVIDED IN THE SYSTEM PROMPT

Original code:
\`\`\`python
${code}
\`\`\`

The system prompt contains the full extracted detection logic. USE IT VERBATIM in your detect_patterns() method.

Please generate complete V31-compliant code with original logic fully preserved.`,
      systemPrompt: paramPreservingPrompt,
      code: code,
      context: `Scanner: ${filename} | Params: ${Object.keys(extractedLogic.params.raw_params || {}).length} | Logic: ${extractedLogic.detectPatternsLogic.length} chars`,
      validateOutput: true,
      temperature: 0.1,
      maxTokens: 16000  // Increased for full logic preservation
    });

    // 🔍 Validate for placeholder patterns BEFORE accepting the output
    const placeholderPatterns = [
      /def\s+_run_pattern_detection\([^)]*\):\s*["']{0,3}[^"']*["']{0,3}\s*return\s+data\s*$/gm,
      /def\s+_run_pattern_detection\([^)]*\):\s*["']{0,3}[^"']*placeholder[^"']*["']{0,3}.*?return\s+data\s*$/gms,
      /#.*placeholder.*?return\s+data/gmi,
      /#.*TODO.*?return\s+data/gmi,
      /def\s+detect_patterns\([^)]*\):\s*["']{0,3}[^"']*["']{0,3}\s*return\s+(?:data|df|pd\.DataFrame\(\))\s*$/gm,
    ];

    let hasPlaceholders = false;
    const foundPlaceholders: string[] = [];

    for (const pattern of placeholderPatterns) {
      const matches = formattedCode.match(pattern);
      if (matches) {
        hasPlaceholders = true;
        foundPlaceholders.push(...matches);
      }
    }

    // Additional check: if detection logic is too short, it's likely a placeholder
    const detectLogicMatch = formattedCode.match(/def\s+(?:detect_patterns|_run_pattern_detection)\s*\([^)]*\):[\s\S]*?(?=\n\s{0,4}def\s|\n\s{0,4}class\s|\n#|\Z)/);
    if (detectLogicMatch && detectLogicMatch[0].length < 500) {
      hasPlaceholders = true;
      foundPlaceholders.push(`Detection logic too short (${detectLogicMatch[0].length} chars) - likely placeholder`);
    }

    if (hasPlaceholders) {
      console.error('❌ PLACEHOLDER DETECTION: AI generated placeholder code instead of using extracted logic!');
      console.error('Found placeholders:', foundPlaceholders);
      return NextResponse.json(
        {
          success: false,
          error: 'AI generated placeholder code. The extracted logic was not preserved. Please try again.',
          details: 'The AI model failed to transplant the extracted detection logic. This is a model limitation.',
          placeholders: foundPlaceholders,
          retry: true
        },
        { status: 500 }
      );
    }

    console.log('✅ No placeholder patterns detected - logic appears preserved');

    // Validate V31 compliance
    const validation = aiService['validateV31Compliance'](formattedCode);
    const score = Math.round((validation.passedChecks.length / (validation.passedChecks.length + validation.failedChecks.length)) * 100);

    console.log(`✅ Renata Final V transformation completed`);
    console.log(`📊 V31 Compliance Score: ${score}%`);
    console.log(`✅ Passed: ${validation.passedChecks.length}`);
    if (validation.failedChecks.length > 0) {
      console.log(`❌ Failed: ${validation.failedChecks.length}`);
      validation.failedChecks.forEach(check => console.log(`   - ${check}`));
    }

    return NextResponse.json({
      success: true,
      formattedCode: formattedCode,
      scannerType: 'v31-compliant',
      integrityVerified: validation.isValid,
      model: 'Renata Final V (qwen/qwen-2.5-coder-32b-instruct)',
      v31ComplianceScore: score,
      validationChecks: {
        passed: validation.passedChecks,
        failed: validation.failedChecks
      },
      warnings: validation.isValid ? [] : ['Some V31 requirements not met'],
      errors: []
    });

  } catch (error) {
    console.error('❌ Renata Final V Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Renata Final V error: ' + (error as Error).message
      },
      { status: 500 }
    );
  }
}