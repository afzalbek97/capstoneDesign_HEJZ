# U-STAR 🎵💃

> **O'zbek** | [English](#english)

---

## O'zbek tili

### Loyiha haqida

**U-STAR** — sun'iy intellekt yordamida musiqa yaratish va raqsga o'rgatish platformasi. O'rta maktab o'quvchilari uchun mo'ljallangan: foydalanuvchi o'zi xohlagan kayfiyatdagi musiqani yaratadi, so'ng AI shu musiqaning his-tuyg'usini tahlil qilib, mos raqs harakatlarini tavsiya etadi. Yaratilgan kontent jamiyat lentasida boshqalar bilan ulashiladi.

### Qanday ishlaydi?

```
Foydalanuvchi prompt yozadi
       ↓
SUNO API musiqa yaratadi
       ↓
OpenAI GPT qo'shiq so'zlaridan his-tuyg'uni aniqlaydi
(masalan: "xursandchilik", "g'amginlik", "hayajon")
       ↓
His-tuyg'uga mos raqs harakatlari tavsiya etiladi
       ↓
Foydalanuvchi raqsni mashq qilib, jamoatga ulashadi
```

### Asosiy imkoniyatlar

| # | Imkoniyat | Tavsif |
|---|-----------|--------|
| 1 | **AI Musiqa Yaratish** | Foydalanuvchi kayfiyat va mavzuni yozadi, SUNO API asl musiqa yaratadi |
| 2 | **His-tuyg'u Tahlili** | GPT qo'shiq so'zlarini o'qib, ularning his-tuyg'u kategoriyasini aniqlaydi |
| 3 | **Raqs Tavsiyasi** | Aniqlangan his-tuyg'uga mos raqs harakatlari va videolari ko'rsatiladi |
| 4 | **Jamiyat Lentasi** | Yaratilgan kontent yuklanadi, boshqalar lentasida ko'rinadi |
| 5 | **Like asosida tavsiya** | Ko'p like olgan postlar lentada ustunlik qiladi |

### Texnologiyalar

| Qatlam | Texnologiya |
|--------|-------------|
| Mobil ilova | React Native (TypeScript) |
| Server | Spring Boot 3.3 (Java 17) |
| Ma'lumotlar bazasi | MySQL 8 |
| Infratuzilma | Docker |
| AI — Musiqa | SUNO API |
| AI — Tahlil | OpenAI GPT |
| Fayl saqlash | AWS S3 |

### Loyiha tuzilmasi

```
capstoneDesign_HEJZ/
├── HEJZ_front/   ← React Native mobil ilova (Android/iOS)
└── HEJZ_back/    ← Spring Boot REST API serveri
```

---

## English

### About the Project

**U-STAR** is an AI-powered music generation and dance recommendation community platform targeting middle and high school students. Users generate original music by describing a mood or theme, the AI analyzes the emotional tone of the lyrics, and matching dance choreography is recommended. Created content can be shared on a community feed.

### How It Works

```
User writes a prompt (mood/theme)
       ↓
SUNO API generates original music + lyrics
       ↓
OpenAI GPT analyzes lyrics → detects emotion
(e.g. happy, sad, excited, calm...)
       ↓
Dance choreography matching that emotion is recommended
       ↓
User practices and shares their performance on the feed
```

### Key Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | **AI Music Generation** | User describes a vibe; SUNO API generates an original song |
| 2 | **Emotion Analysis** | GPT reads the generated lyrics and classifies their emotional category |
| 3 | **Dance Recommendation** | Dance moves and videos matching the detected emotion are presented |
| 4 | **Community Feed** | Users upload their content and appear in others' feeds |
| 5 | **Like-based Recommendation** | Posts with more likes are ranked higher in the feed |

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile App | React Native (TypeScript) |
| Backend API | Spring Boot 3.3 (Java 17) |
| Database | MySQL 8 |
| Infrastructure | Docker |
| AI — Music | SUNO API |
| AI — Analysis | OpenAI GPT |
| File Storage | AWS S3 |

### Project Structure

```
capstoneDesign_HEJZ/
├── HEJZ_front/   ← React Native mobile app (Android/iOS)
└── HEJZ_back/    ← Spring Boot REST API server
```

### System Architecture

```
Mobile App (React Native)
        │  REST API + JWT Auth
        ▼
Spring Boot Server (:8080)
   ├── Music domain   → SUNO API
   ├── Dance domain   → OpenAI GPT
   └── Community domain → AWS S3
        │
        ▼
   MySQL Database
```

### Future Improvements

- [ ] Redis-based caching for trending posts
- [ ] More advanced recommendation algorithm
