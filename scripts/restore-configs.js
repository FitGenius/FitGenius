const fs = require('fs');
const path = require('path');

console.log('🔄 Restaurando configurações originais...');

const files = [
  'tsconfig.json.backup',
  '.eslintrc.json.backup'
];

files.forEach(backupFile => {
  const backupPath = path.join(__dirname, '..', backupFile);
  const originalPath = backupPath.replace('.backup', '');

  if (fs.existsSync(backupPath)) {
    fs.renameSync(backupPath, originalPath);
    console.log('✅ Restaurado:', originalPath.split('/').pop());
  }
});

console.log('✅ Configurações restauradas!');