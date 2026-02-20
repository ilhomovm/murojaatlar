# GitHub ga push qilish bo‘yicha qo‘llanma

## 1-qadam: Git o‘rnatish

1. **Git yuklab oling:**  
   https://git-scm.com/download/win

2. **O‘rnating** — “Next” tugmalarini bosib, default sozlamalarni qoldiring.

3. **Kompyuterni qayta ishga tushiring** (yoki CMD/PowerShell oynasini yoping va qayta oching).

4. **Tekshirish** — yangi terminalda yozing:
   ```
   git --version
   ```
   Agar versiya chiqsa, Git to‘g‘ri o‘rnatilgan.

---

## 2-qadam: GitHub akkaunt bilan bog‘lanish

### Variant A: GitHub Desktop (oson)

1. **GitHub Desktop yuklab oling:**  
   https://desktop.github.com

2. O‘rnating va GitHub hisobingizga kiring.

3. **File → Add Local Repository** → `C:\Users\user\Desktop\murojaatlar` papkasini tanlang.

4. Agar “Initialize Git Repository” xabari chiqsa, **Initialize** ni bosing.

5. Keyin **Publish repository** yoki **Push origin** tugmasini bosing.

### Variant B: Qo‘lda (terminal)

1. **Terminal oching** (CMD yoki PowerShell).

2. **Personal Access Token** yarating:
   - GitHub.com ga kiring
   - **Settings** → **Developer settings** → **Personal access tokens**
   - **Generate new token** → nom bering, “repo” qatorini belgilang
   - Token yaratilgach, uni nusxalab boshqa joyga saqlang (keyin ko‘rsatilmaydi)

3. **Loyiha papkasiga o‘ting:**
   ```
   cd C:\Users\user\Desktop\murojaatlar
   ```

4. **Git boshlang:**
   ```
   git init
   ```

5. **GitHub reponi ulang:**
   ```
   git remote add origin https://github.com/ilhomovm/murojaatlar.git
   ```

6. **Fayllarni qo‘shing:**
   ```
   git add .
   ```

7. **Commit qiling:**
   ```
   git commit -m "Birinchi versiya"
   ```

8. **Main branch qiling:**
   ```
   git branch -M main
   ```

9. **Push qiling:**
   ```
   git push -u origin main
   ```

10. **Login/parol so‘ralsa:**
    - **Username:** GitHub foydalanuvchi nomingiz (masalan: ilhomovm)
    - **Password:** oddiy parol emas — yuqorida yaratgan **Personal Access Token** ni kiriting

---

## 3-qadam: push.bat orqali push qilish

Git va remote o‘rnatilgandan keyin:

1. `push.bat` faylini **ikki marta** bosing.
2. Agar o‘zgarishlar bo‘lsa, ular avtomatik commit va push qilinadi.

**Eslatma:** Birinchi marta `git init` va `git remote add` qo‘lda qilish kerak. Keyingi safarlar faqat `push.bat` ni ishlatishingiz mumkin.

---

## Xato va yechimlar

| Xato | Yechim |
|------|--------|
| `git is not recognized` | Git o‘rnating va terminalni qayta oching |
| `Permission denied` | GitHub’ga kiring va tokenni tekshiring |
| `failed to push` | Repo ochiqligini tekshiring; token’da `repo` huquqi bo‘lishi kerak |
| `nothing to commit` | Yangi o‘zgarishlar yo‘q — hammasi allaqachon push qilingan |
