@echo off
echo GitHub ga push qilish...
cd /d "%~dp0"
if not exist .git (
  git init
  git remote add origin https://github.com/ilhomovm/murojaatlar.git
)
git add .
git status
git commit -m "Murojaatlar loyihasi"
git branch -M main
git push -u origin main
pause
