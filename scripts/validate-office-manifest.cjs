const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

function validateManifest(content) {
  const xml = new JSDOM(content, { contentType: 'application/xml' }).window.document;
  const namespace = 'http://schemas.microsoft.com/office/appforoffice/1.1';
  for (const name of ['RequestedWidth', 'RequestedHeight']) {
    const nodes = xml.getElementsByTagNameNS(namespace, name);
    const value = nodes.length === 1 ? nodes[0].textContent.trim() : '';
    if (!/^\d+$/.test(value) || Number(value) < 32 || Number(value) > 1000) {
      throw new Error(`${name} must be an integer between 32 and 1000 for an Office content add-in.`);
    }
  }
  return true;
}

module.exports = { validateManifest };
if (require.main === module) {
  validateManifest(fs.readFileSync(process.argv[2] || path.join(__dirname, '../public/office/quizzz-manifest.xml'), 'utf8'));
  console.log('Office content add-in dimensions are valid.');
}
