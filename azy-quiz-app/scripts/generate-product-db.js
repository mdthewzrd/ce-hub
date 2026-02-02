/**
 * Shopify Product Tagger - Quick Reference Generator
 *
 * This script fetches all your products from Shopify and generates:
 * 1. A CSV file with suggested tags
 * 2. A Markdown reference sheet
 *
 * Usage:
 * 1. Set your SHOPIFY_ACCESS_TOKEN in .env.local
 * 2. Run: node scripts/generate-product-db.js
 * 3. Find output in:
 *    - product-tagging-reference.md (for easy reading)
 *    - product-tagging-database.csv (for spreadsheet import)
 */

const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL || 'https://azyr-specs.myshopify.com';
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || '';

async function fetchProducts() {
  console.log('🔍 Fetching products from Shopify...');

  const query = `
    query {
      products(first: 250) {
        edges {
          node {
            id
            title
            handle
            productType
            tags
            bodyHtml
            images(first: 1) {
              edges {
                node {
                  src
                  altText
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(
      `${SHOPIFY_STORE_URL}/admin/api/2024-01/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
        },
        body: JSON.stringify({ query }),
      }
    );

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data.products.edges.map((edge, index) => {
      const product = edge.node;
      const productId = product.id.split('/').pop();
      return {
        index: index + 1,
        id: productId,
        title: product.title,
        handle: product.handle,
        url: `${SHOPIFY_STORE_URL}/admin/products/${productId}`,
        tags: product.tags || [],
        description: product.bodyHtml || '',
        image: product.images.edges[0]?.node?.src || '',
      };
    });
  } catch (error) {
    console.error('❌ Error fetching products:', error.message);
    throw error;
  }
}

function generateSuggestedTags(product) {
  const text = `${product.title} ${product.description}`.toLowerCase();
  const tags = [];

  // Style tags
  if (/aviator|teardrop|pilot/i.test(text)) tags.push('style:aviator');
  if (/cat.?eye|upswept|50s|60s/i.test(text)) tags.push('style:cat_eye');
  if (/round|circle|circular/i.test(text)) tags.push('style:round');
  if (/rectangle|rectangular/i.test(text)) tags.push('style:rectangle');
  if (/square|boxy/i.test(text)) tags.push('style:square');
  if (/wayfarer|trapezoid/i.test(text)) tags.push('style:wayfarer');

  // Material tags
  if (/wire|metal|titanium|gold|silver|steel/i.test(text)) tags.push('material:wire');
  if (/acetate|plastic|chunky|thick/i.test(text)) tags.push('material:acetate');

  // Vibe tags
  if (/vintage|retro|70s|80s|90s/i.test(text)) tags.push('vibe:retro');
  if (/modern|contemporary|minimal/i.test(text)) tags.push('vibe:modern');
  if (/luxury|premium|designer/i.test(text)) tags.push('vibe:luxury');
  if (/edgy|bold|statement/i.test(text)) tags.push('vibe:edgy');

  // Lens tags
  if (/polarized/i.test(text)) tags.push('lens:polarized');
  if (/prescription|rx/i.test(text)) tags.push('lens:rx');
  if (/blue.?light|computer|screen/i.test(text)) tags.push('lens:blue_light');
  if (/tint|gradient|colored/i.test(text)) tags.push('lens:tinted');

  // Default face shape (most work for oval)
  if (!tags.some(t => t.startsWith('face_shape:'))) {
    tags.push('face_shape:oval', 'face_shape:heart', 'face_shape:square');
  }

  return tags;
}

function hasQuizTags(tags) {
  return tags.some(tag =>
    tag.startsWith('style:') ||
    tag.startsWith('material:') ||
    tag.startsWith('vibe:') ||
    tag.startsWith('face_shape:') ||
    tag.startsWith('lens:')
  );
}

function generateMarkdown(products) {
  let markdown = `# AZYR Product Tagging Reference\n\n`;
  markdown += `**Generated:** ${new Date().toLocaleString()}\n`;
  markdown += `**Total Products:** ${products.length}\n\n`;
  markdown += `---\n\n`;

  // Products needing tagging
  const needsTagging = products.filter(p => !hasQuizTags(p.tags));
  markdown += `## 📋 Products Needing Tagging (${needsTagging.length})\n\n`;

  needsTagging.forEach((product) => {
    const suggestedTags = generateSuggestedTags(product);

    markdown += `### ${product.index}. ${product.title}\n\n`;
    markdown += `**🔗 Shopify Admin:** [View Product](${product.url})\n\n`;
    markdown += `**🏷️ Suggested Tags:**\n`;
    markdown += `\`\`\`\n${suggestedTags.join('\n')}\n\`\`\`\n\n`;
    markdown += `---\n\n`;
  });

  // Already tagged
  const tagged = products.filter(p => hasQuizTags(p.tags));
  if (tagged.length > 0) {
    markdown += `## ✅ Already Tagged (${tagged.length})\n\n`;
    tagged.forEach(p => {
      const quizTags = p.tags.filter(tag =>
        tag.startsWith('style:') ||
        tag.startsWith('material:') ||
        tag.startsWith('vibe:') ||
        tag.startsWith('face_shape:') ||
        tag.startsWith('lens:')
      );
      markdown += `- **${p.title}**\n  Tags: ${quizTags.join(', ')}\n\n`;
    });
  }

  return markdown;
}

function generateCSV(products) {
  const headers = ['Index', 'Product Name', 'Shopify URL', 'Status', 'Suggested Tags'];
  let csv = headers.join(',') + '\n';

  products.forEach(product => {
    const suggestedTags = generateSuggestedTags(product).join(' | ');
    const status = hasQuizTags(product.tags) ? 'ALREADY TAGGED' : 'NEEDS TAGGING';

    csv += [
      product.index,
      `"${product.title}"`,
      `"${product.url}"`,
      status,
      `"${suggestedTags}"`,
    ].join(',') + '\n';
  });

  return csv;
}

async function main() {
  try {
    console.log('🚀 Starting Product Database Generation...\n');

    // Check credentials
    if (!SHOPIFY_ACCESS_TOKEN || SHOPIFY_ACCESS_TOKEN.includes('xxxx')) {
      console.error('❌ SHOPIFY_ACCESS_TOKEN not configured!');
      console.error('\nPlease set your Shopify access token in .env.local:');
      console.error('SHOPIFY_ACCESS_TOKEN=shpat_your_actual_token_here\n');
      process.exit(1);
    }

    // Fetch products
    const products = await fetchProducts();
    console.log(`✅ Found ${products.length} products\n`);

    // Generate files
    const markdown = generateMarkdown(products);
    const csv = generateCSV(products);

    // Write files
    const fs = require('fs');
    const path = require('path');

    const outputDir = path.join(__dirname, '..', 'product-database');
    fs.mkdirSync(outputDir, { recursive: true });

    const mdPath = path.join(outputDir, 'product-tagging-reference.md');
    const csvPath = path.join(outputDir, 'product-tagging-database.csv');

    fs.writeFileSync(mdPath, markdown);
    fs.writeFileSync(csvPath, csv);

    console.log('✅ Files generated successfully!');
    console.log(`\n📄 Markdown Reference: ${mdPath}`);
    console.log(`📊 CSV Database: ${csvPath}`);
    console.log(`\n💡 Open the markdown file to see all products with suggested tags!\n`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nMake sure:');
    console.error('1. Your SHOPIFY_ACCESS_TOKEN is set in .env.local');
    console.error('2. The token has read_products scope');
    console.error('3. Your store URL is correct\n');
    process.exit(1);
  }
}

main();
