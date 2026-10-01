const fs = require('fs');
const path = require('path');

const adminPagesDir = path.join(__dirname, '../src/pages/admin');
const files = fs.readdirSync(adminPagesDir).filter(f => f.endsWith('.jsx'));

files.forEach(file => {
  const filePath = path.join(adminPagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('/admin/')) {
    content = content.replace(/\/admin\//g, '/super-admin/');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated ' + file);
  }
});

const layoutPath = path.join(__dirname, '../src/layouts/AdminLayout.jsx');
let layoutContent = fs.readFileSync(layoutPath, 'utf8');
layoutContent = layoutContent.replace(/\/admin\//g, '/super-admin/');
fs.writeFileSync(layoutPath, layoutContent, 'utf8');
console.log('Updated AdminLayout.jsx');

const loginPath = path.join(__dirname, '../src/pages/admin/AdminLoginPage.jsx');
let loginContent = fs.readFileSync(loginPath, 'utf8');
loginContent = loginContent.replace(/\/admin\//g, '/super-admin/');
fs.writeFileSync(loginPath, loginContent, 'utf8');
console.log('Updated AdminLoginPage.jsx');
