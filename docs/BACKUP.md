# 📦 EcoSustain Backup & Restore Guide

## Quick Backup Command

### Windows (PowerShell)
```powershell
# Create backup folder with timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd_HHmm"
$backupDir = "D:\ecosustain-backup-$timestamp"

# Create backup (excluding node_modules and .env)
New-Item -ItemType Directory -Path $backupDir -Force
Copy-Item -Path "D:\hehehe\*" -Destination $backupDir -Recurse -Exclude @("node_modules", ".env", "*.log")

Write-Host "✅ Backup created at: $backupDir"
```

### Mac/Linux
```bash
# Create backup with timestamp
timestamp=$(date +%Y-%m-%d_%H%M)
backup_dir="~/ecosustain-backup-$timestamp"

# Create backup
mkdir -p $backup_dir
rsync -av --exclude='node_modules' --exclude='.env' --exclude='*.log' ./hehehe/ $backup_dir/

echo "✅ Backup created at: $backup_dir"
```

---

## Automated Backup Script

Save this as `backup.js` in project root:

```javascript
const fs = require('fs');
const path = require('path');

const EXCLUDE = ['node_modules', '.env', '.git', '*.log', 'backup'];

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    // Skip excluded
    if (EXCLUDE.some(ex => entry.name.includes(ex.replace('*', '')))) {
      continue;
    }
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const timestamp = new Date().toISOString().slice(0,16).replace(/[:-]/g, '');
const backupDir = `./backup/ecosustain-${timestamp}`;

console.log('📦 Creating backup...');
copyDir('./', backupDir);
console.log(`✅ Backup created: ${backupDir}`);
```

Run with: `node backup.js`

---

## Git-based Backup (Recommended)

### Initial Setup
```bash
# Initialize git (if not done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial backup"

# Add remote (GitHub/GitLab)
git remote add origin https://github.com/YOUR_USERNAME/ecosustain.git

# Push to remote
git push -u origin main
```

### Create Backup Point
```bash
# Before major changes
git add .
git commit -m "Backup before [feature name]"
git push
```

### Restore from Backup
```bash
# See all commits
git log --oneline

# Restore to specific commit
git checkout <commit-hash>

# Or create new branch from old commit
git checkout -b restore-point <commit-hash>
```

---

## Database Backup

### Export MongoDB Data
```bash
# Using mongodump
mongodump --uri="mongodb+srv://username:password@cluster.mongodb.net/ecosustain" --out=./backup/db

# Or using mongoexport for specific collection
mongoexport --uri="mongodb+srv://..." --collection=users --out=./backup/users.json
```

### Import MongoDB Data
```bash
# Restore entire database
mongorestore --uri="mongodb+srv://..." ./backup/db

# Import specific collection
mongoimport --uri="mongodb+srv://..." --collection=users --file=./backup/users.json
```

---

## Emergency Recovery Steps

### If Code is Corrupted
1. Check Git history: `git log`
2. Restore last working commit: `git checkout <commit-hash>`
3. Create new branch: `git checkout -b recovery`
4. Fix issues
5. Merge back: `git checkout main && git merge recovery`

### If Database is Corrupted
1. Go to MongoDB Atlas
2. Click "Backup" in left menu
3. Select snapshot to restore
4. Click "Restore"

### If .env is Lost
1. Check `.env.example` for structure
2. Regenerate API keys from respective dashboards
3. Update MongoDB password if needed

---

## Backup Checklist

- [ ] Code pushed to GitHub
- [ ] .env.example updated with all keys
- [ ] Database snapshot taken
- [ ] Local backup folder created
- [ ] Documentation updated

---

## Important Files to Always Backup

| File/Folder | Why |
|-------------|-----|
| `src/` | All backend code |
| `public/` | All frontend code |
| `docs/` | Documentation |
| `.env.example` | Environment template |
| `package.json` | Dependencies |
| `seed-data.js` | Sample data script |

---

## Never Backup These (Regenerable)

| File/Folder | Why |
|-------------|-----|
| `node_modules/` | Can reinstall with `npm install` |
| `.env` | Contains secrets, regenerate |
| `*.log` | Temporary logs |
| `.git/` | Git handles its own backup |
