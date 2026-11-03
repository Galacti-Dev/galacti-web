/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const htmlJsPath = path.join(__dirname, '../node_modules/@react-three/drei/web/Html.js');

if (fs.existsSync(htmlJsPath)) {
  let content = fs.readFileSync(htmlJsPath, 'utf8');

  // Check if patch is needed for safe removeChild and asynchronous unmount
  const originalPattern = /if\s*\(target\)\s*target\.removeChild\(el\);\s*currentRoot\.unmount\(\);/;
  const patchedCode = `if (target && typeof target.contains === 'function' && target.contains(el)) {
          try { target.removeChild(el); } catch (e) {}
        }
        setTimeout(() => {
          try { currentRoot.unmount(); } catch (e) {}
        }, 0);`;

  if (originalPattern.test(content)) {
    content = content.replace(originalPattern, patchedCode);
    fs.writeFileSync(htmlJsPath, content, 'utf8');
    console.log('[patch-drei] Successfully patched Html.js for React 19 lifecycle safety.');
  } else if (content.includes('setTimeout(() => {')) {
    console.log('[patch-drei] Html.js already patched.');
  } else {
    console.log('[patch-drei] Notice: Pattern not found in Html.js (might be different version).');
  }
} else {
  console.log('[patch-drei] Html.js not found in node_modules.');
}
