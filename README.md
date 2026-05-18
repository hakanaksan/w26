# FIFA World Cup 2026 - Fixture Tracker

2026 FIFA Dünya Kupası fikstür takip uygulaması. Gün gün maçları görüntüleyin, sonuçları girin ve bildirimler kurun.

## Özellikler

- **Gün Gün Fikstür**: Tüm maçları tarih bazlı görüntüleyin
- **Sonuç Girişi**: Maç sonuçlarını kaydedin
- **Grup Puan Durumu**: Tüm grupların güncel puan durumunu takip edin
- **Bildirimler**: Maçlar için bildirim kurun
- **Responsive Tasarım**: Mobil ve masaüstü uyumlu

## Kurulum

### Gereksinimler

- Node.js 18+
- npm veya yarn

### Lokal Geliştirme

1. Bağımlılıkları yükleyin:
```bash
npm install
```

2. Geliştirme sunucusunu başlatın:
```bash
npm run dev
```

3. Tarayıcınızda `http://localhost:3000` adresini açın.

## Turso Veritabanı Kurulumu

1. [Turso](https://turso.tech) hesabı oluşturun

2. Turso CLI'ı yükleyin:
```bash
curl -sSfL https://get.tur.so/install.sh | bash
```

3. Giriş yapın:
```bash
turso auth login
```

4. Veritabanı oluşturun:
```bash
turso db create world-cup-2026
```

5. Veritabanı URL'sini ve token'ı alın:
```bash
turso db show world-cup-2026 --url
turso db tokens create world-cup-2026
```

6. `.env.local` dosyasını güncelleyin:
```
TURSO_DATABASE_URL=libsql://your-db-name.turso.io
TURSO_AUTH_TOKEN=your-auth-token
```

## Vercel'e Deploy

### Yöntem 1: Vercel CLI

1. Vercel CLI'ı yükleyin:
```bash
npm i -g vercel
```

2. Deploy edin:
```bash
vercel
```

3. Ortam değişkenlerini ekleyin:
```bash
vercel env add TURSO_DATABASE_URL
vercel env add TURSO_AUTH_TOKEN
```

### Yöntem 2: GitHub + Vercel Dashboard

1. Projeyi GitHub'a push edin:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

2. [Vercel Dashboard](https://vercel.com/dashboard)'a gidin

3. "New Project" tıklayın ve GitHub repo'nuzu seçin

4. Environment Variables bölümünde şunları ekleyin:
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`

5. "Deploy" tıklayın

## Proje Yapısı

```
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API Routes
│   │   │   ├── matches/        # Match endpoints
│   │   │   └── notifications/  # Notification endpoints
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Main page
│   │   └── globals.css         # Global styles
│   ├── components/             # React components
│   │   ├── Header.tsx
│   │   ├── DaySelector.tsx
│   │   ├── MatchCard.tsx
│   │   ├── GroupStandings.tsx
│   │   ├── NotificationModal.tsx
│   │   └── NotificationsList.tsx
│   ├── data/                   # Static data
│   │   ├── teams.ts            # Teams and groups
│   │   └── fixtures.ts         # Match fixtures
│   └── lib/                    # Utilities
│       ├── db.ts               # Database connection
│       └── schema.ts           # Database schema
├── public/                     # Static assets
├── .env.local                  # Environment variables
├── next.config.js              # Next.js config
├── tailwind.config.ts          # Tailwind config
└── package.json
```

## Teknolojiler

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Turso/libSQL** - Database
- **Drizzle ORM** - Database ORM
- **Vercel** - Hosting

## Lisans

MIT
