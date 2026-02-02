import { geminiService } from './lib/gemini.ts';

async function test() {
  try {
    const result = await geminiService.processTryOn(
      '/Users/michaeldurante/ai dev/ce-hub/tryon-platform/tryon-platform/public/uploads/92a92b2a-fc8b-4a4d-bfa7-a4be4170ed1b/subject_0_fcbef6b69f6ae56a0f187a03a85aef87.jpg',
      ['/Users/michaeldurante/ai dev/ce-hub/tryon-platform/tryon-platform/public/uploads/projects/2e817d16-2b75-4222-8f9d-578c94312d84/glasses_2_716736982946_P00_2e5cc48a-8d4e-453d-bcc6-7e9ad0051257.webp'],
      {
        guidance: 0.6,
        refStrength: 0.85,
        lightingWeight: 0.7,
        reflectionWeight: 0.8,
        colorMatchWeight: 0.15,
        seed: 12345
      },
      'test-direct-' + Date.now(),
      undefined
    );
    
    console.log('SUCCESS:', result);
  } catch (error) {
    console.error('ERROR:', error.message);
    console.error('STACK:', error.stack);
  }
}

test();
