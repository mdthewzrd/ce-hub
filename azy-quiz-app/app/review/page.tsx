import { readFileSync } from 'fs';
import { join } from 'path';

export const metadata = {
  title: 'AZYR Product Tag Review',
};

export default function ReviewPage() {
  // Read the HTML file
  const htmlPath = join(process.cwd(), 'public', 'verification', 'SIMPLE_REVIEW.html');
  const html = readFileSync(htmlPath, 'utf-8');

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </>
  );
}

// Don't use the default layout
ReviewPage.isLayout = function() {
  return true;
};
