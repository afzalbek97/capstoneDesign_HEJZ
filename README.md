# U-STAR 🎵💃

> **O'zbek** | [English](#english) | [한국어](#한국어)

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

---

## 한국어

### 프로젝트 소개

**U-STAR**는 생성형 AI 기반의 음악 생성 및 감정 연계 안무 추천 커뮤니티 플랫폼입니다. 중·고등학생을 대상으로 설계되었으며, 사용자가 원하는 분위기를 입력하면 AI가 음악을 생성하고, 해당 음악의 감정을 분석하여 어울리는 안무를 추천합니다. 생성된 콘텐츠는 커뮤니티 피드에서 다른 사용자와 공유할 수 있습니다.

### 작동 방식

```
사용자가 프롬프트 입력 (분위기/테마)
       ↓
SUNO API가 음악 + 가사 생성
       ↓
OpenAI GPT가 가사를 분석하여 감정 분류
(예: 행복, 슬픔, 열정, 차분함...)
       ↓
해당 감정에 맞는 안무 추천
       ↓
사용자가 안무를 연습하고 피드에 공유
```

### 주요 기능

| # | 기능 | 설명 |
|---|------|------|
| 1 | **AI 음악 생성** | 사용자가 분위기를 입력하면 SUNO API가 오리지널 곡을 생성 |
| 2 | **감정 분석** | GPT가 생성된 가사를 읽고 감정 카테고리를 분류 |
| 3 | **안무 추천** | 분류된 감정에 맞는 안무 영상 제공 |
| 4 | **커뮤니티 피드** | 생성한 콘텐츠를 업로드하여 다른 사용자 피드에 노출 |
| 5 | **좋아요 기반 추천** | 좋아요가 많은 게시물이 피드 상단에 우선 노출 |

### 기술 스택

| 레이어 | 기술 |
|--------|------|
| 모바일 앱 | React Native (TypeScript) |
| 백엔드 API | Spring Boot 3.3 (Java 17) |
| 데이터베이스 | MySQL 8 |
| 인프라 | Docker |
| AI — 음악 | SUNO API |
| AI — 분석 | OpenAI GPT |
| 파일 저장 | AWS S3 |

### 프로젝트 구조

```
capstoneDesign_HEJZ/
├── HEJZ_front/   ← React Native 모바일 앱 (Android/iOS)
└── HEJZ_back/    ← Spring Boot REST API 서버
```

### 시스템 아키텍처

```
모바일 앱 (React Native)
        │  REST API + JWT 인증
        ▼
Spring Boot 서버 (:8080)
   ├── 음악 도메인   → SUNO API
   ├── 댄스 도메인   → OpenAI GPT
   └── 커뮤니티 도메인 → AWS S3
        │
        ▼
   MySQL 데이터베이스
```

### 향후 개선 방향

- [ ] Redis 기반 인기 게시물 캐싱
- [ ] 추천 알고리즘 고도화
