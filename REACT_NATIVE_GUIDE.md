# React Native Guide — Từ React Web sang React Native

> Dành cho dev React web muốn học React Native từ đầu

---

## Mục lục

1. [React Native là gì? Khác gì React Web?](#1-react-native-là-gì)
2. [Kiến trúc React Native hoạt động thế nào](#2-kiến-trúc)
3. [Expo vs Bare React Native](#3-expo-vs-bare)
4. [Cấu trúc thư mục chuẩn doanh nghiệp](#4-cấu-trúc-thư-mục)
5. [Navigation trong RN](#5-navigation)
6. [Styling: Không có CSS](#6-styling)
7. [State Management & Data Flow](#7-state-management)
8. [API Calls & Caching](#8-api-calls)
9. [Các component thay thế HTML tag](#9-component-thay-thế-html)
10. [Offline & Storage](#10-offline-storage)
11. [Testing & Debugging](#11-testing)
12. [Publishing & Deployment](#12-publishing)

---

## 1. React Native là gì?

### React Web (bạn biết rồi)

```
Browser
  └── React DOM (virtual DOM → real DOM)
        └── <div>, <p>, <span>, <input>...
              └── CSS (Flexbox, Grid, colors...)
```

### React Native

```
Mobile Device
  └── React Native (virtual tree → Native widgets)
        └── <View>, <Text>, <TextInput>, <ScrollView>...
              └── JavaScript StyleSheet (Flexbox, subset of CSS)
```

**Khác biệt cốt lõi:**

| Web | Native | Giải thích |
|-----|--------|------------|
| `<div>` | `<View>` | Khối cơ bản (div = View) |
| `<span>`, `<p>` | `<Text>` | Text phải dùng `<Text>`, không cho text trong `<View>` |
| `<input>` | `<TextInput>` | Ô nhập liệu |
| `<button>` | `<TouchableOpacity>` / `<Pressable>` | Button cảm ứng |
| `<img>` | `<Image>` | Hiển thị ảnh |
| `<ul>/<li>` | `FlatList` / `ScrollView` | Danh sách (FlatList tối ưu cho list dài) |
| CSS Stylesheet | `StyleSheet.create()` | Object-based styling |
| `:hover` | `Pressable` state | Không có hover trên mobile |
| `div onClick` | `onPress` | Event click là `onPress` |
| CSS animations | `Animated` / `react-native-reanimated` | Animation native |
| `<a>` | `Link` (Expo Router) hoặc navigation | Chuyển trang |
| `localStorage` | `AsyncStorage` | Lưu key-value local |

### Quan trọng: Không có CSS, không có DOM

- **Không** có file `.css` hay `.scss`
- **Không** có class names, CSS selectors, pseudo-classes
- **Không** có `:hover`, `:focus`, `@media`
- **Không** có `div`, `span`, `p`
- **Không** có `document.querySelector()`, `window`, `localStorage`

> Mọi thứ đều là component JavaScript + StyleSheet object.

---

## 2. Kiến trúc

### Cấu trúc Thread (từ RN cũ đến New Architecture)

```
┌──────────────────────────────────────┐
│            JS Thread                  │  ← React code chạy ở đây
│  (Hermes engine / JSC)               │     (giống browser JS)
│                                       │
│  - React logic                        │
│  - State management                   │
│  - Business logic                     │
│  - API calls                          │
└──────────────┬───────────────────────┘
               │ Bridge / JSI (JSON messages)
               ▼
┌──────────────────────────────────────┐
│         Native Thread                 │  ← Thread chính của app
│  (Main/UI Thread)                     │
│                                       │
│  - UI rendering (View, Text...)       │
│  - Gesture handling                   │
│  - Native modules                     │
└──────────────────────────────────────┘
┌──────────────────────────────────────┐
│        Shadow Thread                  │  ← Tính toán layout
│  (Yoga layout engine)                │
│  - Flexbox layout calculation         │
└──────────────────────────────────────┘
```

### New Architecture (RN 0.76+ / Fabric)

```
┌──────────────────────────────────────┐
│            JS Thread                  │
│                                       │
│  - React logic                        │
│  - State                              │
└──────────────┬───────────────────────┘
               │ JSI (direct C++ binding)
               ▼
┌──────────────────────────────────────┐
│         Fabric (C++ core)             │  ← Shared C++ layer
│                                       │
│  - UI rendering                       │
│  - Layout (Yoga)                      │
│  - Gesture                            │
└──────────────────────────────────────┘
```

> **New Architecture** (Fabric + TurboModules + JSI) nhanh hơn rất nhiều vì bỏ qua Bridge JSON serialization. Expo SDK 54 dùng New Architecture mặc định.

---

## 3. Expo vs Bare React Native

### Expo (được khuyên dùng cho hầu hết dự án)

```
Expo = React Native + Toolchain + SDK tích hợp sẵn
```

| Feature | Expo | Bare RN |
|---------|------|---------|
| Setup | `npx create-expo-app` | `npx @react-native-community/cli init` |
| Build | EAS Build (cloud) | Tự cấu hình Xcode/Gradle |
| OTA Update | Expo Updates | Tự setup CodePush |
| Camera, Location, Audio... | `expo-camera`, `expo-location`, `expo-av`... | `react-native-camera`, `react-native-location`... |
| Router | Expo Router (file-based, như Next.js) | React Navigation (manual config) |
| Native modules | Config plugin (app.json) | Tự cấu hình native code |
| Hỗ trợ Web | Có (RN Web) | Không |

### Khi nào dùng Expo?

✅ **Nên dùng Expo:**
- App thương mại, startup, MVP
- Không cần native module đặc thù
- Cần OTA update
- Cần CI/CD dễ dàng
- Đội ngũ nhỏ

❌ **Không nên dùng Expo (cần prebuild/eject):**
- Cần native module chưa có trong Expo ecosystem
- Cần React Native 3D / AR / heavy native code
- Cần custom notification service

> Dự án **Chinese4VN** dùng Expo là hoàn toàn hợp lý.

---

## 4. Cấu trúc thư mục

### Pattern: Feature-based Modular (chuẩn doanh nghiệp)

```
├── app/                          # EXPO ROUTER — file-based routing
│   ├── _layout.tsx               # Root layout (providers, fonts, safe area)
│   ├── index.tsx                 # Entry point (auth check, redirect)
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Tab navigator config
│   │   ├── index.tsx             # Home screen
│   │   ├── review.tsx            # Review screen
│   │   └── profile.tsx           # Profile screen
│   ├── auth/
│   │   └── index.tsx             # Login/Register
│   ├── onboarding/
│   │   └── index.tsx             # Onboarding wizard
│   ├── learning-path/
│   │   └── [level].tsx           # Level detail (dynamic route)
│   └── lesson/
│       └── [id].tsx              # Lesson player (dynamic route)
│
├── src/
│   ├── components/               # UI COMPONENTS — chia theo domain
│   │   ├── common/               # Dùng chung toàn app
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   └── index.ts          # Re-export
│   │   ├── layout/               # Layout components
│   │   │   ├── SafeArea.tsx
│   │   │   ├── CustomHeader.tsx
│   │   │   ├── TabBar.tsx
│   │   │   └── index.ts
│   │   ├── home/                 # Home screen components
│   │   │   ├── StreakCard.tsx
│   │   │   ├── ReviewBanner.tsx
│   │   │   ├── ContinueCard.tsx
│   │   │   └── HskGrid.tsx
│   │   ├── lesson/               # Lesson screen components
│   │   │   ├── VocabFlashcard.tsx
│   │   │   ├── GrammarCard.tsx
│   │   │   ├── QuizQuestion.tsx
│   │   │   ├── QuizOptions.tsx
│   │   │   ├── ResultScreen.tsx
│   │   │   └── index.ts
│   │   ├── review/               # Review screen components
│   │   │   ├── Flashcard.tsx
│   │   │   ├── RatingButtons.tsx
│   │   │   └── ReviewResult.tsx
│   │   └── profile/              # Profile screen components
│   │       ├── UserInfoCard.tsx
│   │       ├── StatsRow.tsx
│   │       ├── SkillBars.tsx
│   │       └── SettingsList.tsx
│   │
│   ├── features/                 # FEATURE MODULES — business logic
│   │   ├── auth/
│   │   │   ├── hooks/
│   │   │   │   └── useAuth.ts
│   │   │   ├── services/
│   │   │   │   └── authService.ts
│   │   │   └── types/
│   │   │       └── auth.types.ts
│   │   ├── lesson/
│   │   │   ├── hooks/
│   │   │   │   └── useLesson.ts
│   │   │   ├── services/
│   │   │   │   └── lessonService.ts
│   │   │   └── types/
│   │   │       └── lesson.types.ts
│   │   ├── review/
│   │   │   ├── hooks/
│   │   │   │   └── useReview.ts
│   │   │   ├── services/
│   │   │   │   └── reviewService.ts
│   │   │   └── types/
│   │   │       └── review.types.ts
│   │   └── progress/
│   │       ├── hooks/
│   │       │   └── useProgress.ts
│   │       ├── services/
│   │       │   └── progressService.ts
│   │       └── types/
│   │           └── progress.types.ts
│   │
│   ├── store/                    # ZUSTAND STORES
│   │   ├── useUserStore.ts       # Auth + user state
│   │   ├── useLessonStore.ts     # Lesson session state
│   │   └── useHskStore.ts        # HSK content state
│   │
│   ├── hooks/                    # GLOBAL HOOKS
│   │   ├── useContent.ts         # React Query hooks
│   │   └── useAudio.ts           # Audio playback
│   │
│   ├── services/                 # API CLIENT
│   │   └── apiClient.ts          # Axios instance + interceptors
│   │
│   ├── constants/                # CONSTANTS
│   │   ├── theme.ts              # Colors, spacing, typography
│   │   ├── apiRoutes.ts          # API endpoint constants
│   │   └── config.ts             # App config (env vars)
│   │
│   ├── types/                    # GLOBAL TYPES
│   │   ├── user.types.ts
│   │   ├── lesson.types.ts
│   │   └── content.types.ts
│   │
│   ├── utils/                    # UTILITIES
│   │   ├── srsLogic.ts           # SM-2 algorithm
│   │   ├── contentProgress.ts    # Progress calculations
│   │   ├── formatters.ts         # Date/number formatters
│   │   └── validators.ts         # Validation helpers
│   │
│   └── data/                     # LOCAL DATA
│       └── contentRepository.ts  # Offline cache layer
│
├── assets/                       # STATIC ASSETS
│   ├── fonts/                    # Custom fonts
│   ├── images/                   # Images, icons
│   └── audio/                    # Local audio files
│
├── app.json                      # Expo config
├── tsconfig.json
├── package.json
└── .env                          # Environment variables
```

### Giải thích từng thư mục:

#### `app/` — Expo Router (File-based Routing)
Giống `pages/` trong Next.js. Mỗi file là một route.

```
app/
  (tabs)/index.tsx     → / (tab 1)
  (tabs)/review.tsx    → /review (tab 2)
  (tabs)/profile.tsx   → /profile (tab 3)
  lesson/[id].tsx      → /lesson/123 (dynamic route)
```

#### `src/components/` — UI Components
Chia theo domain (common, home, lesson...).

**Nguyên tắc:**
- `common/`: Dùng được ở mọi nơi (Button, Card, Modal...)
- `{feature}/`: Chỉ dùng trong feature đó (StreakCard chỉ dùng ở Home)

#### `src/features/` — Feature Modules
Mỗi feature là một module độc lập gồm:
- `hooks/`: Custom hooks cho feature đó
- `services/`: API calls riêng
- `types/`: TypeScript types riêng

**Tại sao?** Khi app lớn, mỗi feature có thể được develop bởi team riêng, dễ test, dễ maintain.

#### `src/store/` — Zustand Stores
State toàn cục (auth, lesson session, HSK data).

**Tại sao Zustand thay vì Redux?**
- Nhẹ hơn, ít boilerplate
- Không cần Provider
- Dễ dùng với TypeScript
- Đủ mạnh cho 90% app

#### `src/hooks/` — Global Hooks
React Query hooks dùng chung cho nhiều feature.

#### `src/services/` — API Client
Axios instance với interceptor (tự động gắn JWT token, refresh token).

#### `src/constants/` — Constants
- `theme.ts`: Design system tokens
- `apiRoutes.ts`: Tất cả endpoint names (dễ maintain, tránh hardcode)

---

## 5. Navigation

### Expo Router (file-based, like Next.js)

```tsx
// app/(tabs)/_layout.tsx — Bottom tab navigator
export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{ title: 'Trang chủ', tabBarIcon: ({ color }) => <HomeIcon color={color} /> }}
      />
      <Tabs.Screen
        name="review"
        options={{ title: 'Ôn tập', tabBarIcon: ({ color }) => <ReviewIcon color={color} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Cá nhân', tabBarIcon: ({ color }) => <ProfileIcon color={color} /> }}
      />
    </Tabs>
  )
}
```

```tsx
// Chuyển trang (giống Next.js)
import { router } from 'expo-router'

// Push (thêm vào stack)
router.push('/lesson/123')

// Replace (không thể back)
router.replace('/onboarding')

// Back
router.back()

// Deep link
router.push(`/lesson/${lessonId}`)
```

### Cấu trúc navigation tree

```
Root Stack (Stack Navigator)
├── Auth Screen (nếu chưa login)
├── Onboarding Wizard (nếu chưa onboarding)
└── Main Tab Navigator
    ├── Tab 1: Home
    ├── Tab 2: Review
    └── Tab 3: Profile
         └── Stack: Settings, About...
```

---

## 6. Styling

### Không CSS — StyleSheet Object

```tsx
// CÁCH 1: StyleSheet.create (khuyên dùng)
import { StyleSheet, View, Text } from 'react-native'

export default function MyComponent() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2C3E50',
  },
})
```

```tsx
// CÁCH 2: Inline styles (tránh dùng, trừ dynamic)
<View style={{ flex: 1, marginTop: isLoggedIn ? 0 : 20 }} />
```

### Flexbox mặc định

Trong RN, **mọi View mặc định là `display: flex`** (không có `display: block`).

```tsx
// Container dạng column (mặc định)
<View style={{ flex: 1 }}>
  <View style={{ flex: 1 }}> {/* Top half */} </View>
  <View style={{ flex: 1 }}> {/* Bottom half */} </View>
</View>

// Container dạng row
<View style={{ flexDirection: 'row' }}>
  <View style={{ flex: 1 }}> {/* Left */} </View>
  <View style={{ flex: 1 }}> {/* Right */} </View>
</View>
```

### Design System pattern

```ts
// constants/theme.ts
export const colors = {
  primary: '#FF6B35',
  secondary: '#004E89',
  success: '#2ECC71',
  error: '#E74C3C',
  warning: '#F39C12',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  text: '#2C3E50',
  textSecondary: '#7F8C8D',
  border: '#E0E0E0',
} as const

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const

export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, lineHeight: 34 },
  h2: { fontSize: 22, fontWeight: '700' as const, lineHeight: 28 },
  h3: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 22 },
  caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
} as const

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999,
} as const
```

```tsx
// Dùng trong component
import { colors, spacing, typography, borderRadius } from '@/constants/theme'

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // Android shadow
  },
  title: {
    ...typography.h3,
    color: colors.text,
  },
})
```

### Responsive (kích thước màn hình)

```tsx
import { Dimensions, PixelRatio } from 'react-native'

const { width, height } = Dimensions.get('window')

// Scale font theo kích thước màn hình (tránh dùng)
const scale = width / 375 // iPhone SE base
const moderateScale = (size: number) => size * Math.min(scale, 1.3)
```

> **Best practice:** Dùng `flex` + percentage thay vì hardcode pixel.

---

## 7. State Management

### Luồng dữ liệu tổng thể

```
┌─────────────────────────────────────────────────────┐
│                    Components                         │
│  (Đọc state từ store/hooks, render UI)               │
└──────────┬──────────────────────────┬────────────────┘
           │                          │
           ▼                          ▼
┌─────────────────┐     ┌──────────────────────────┐
│  Zustand Store   │     │  React Query (TanStack)  │
│  (Client State)  │     │  (Server State)          │
│                  │     │                          │
│  - user info     │     │  - lessons list          │
│  - auth token    │     │  - vocab data            │
│  - UI state      │     │  - progress              │
│  - lesson session│     │  - SRS items             │
└──────────┬───────┘     └────────────┬─────────────┘
           │                          │
           ▼                          ▼
┌──────────────────────────────────────────────┐
│           API Client (Axios)                  │
│  - Attach JWT token                           │
│  - Auto refresh token                         │
│  - Error handling                             │
└──────────────────┬───────────────────────────┘
                   ▼
            NestJS Backend
```

### Khi nào dùng cái gì?

| Loại State | Công cụ | Ví dụ |
|-----------|---------|-------|
| **Server state** (dữ liệu từ API) | React Query | Danh sách bài học, từ vựng, progress |
| **Auth state** | Zustand | Token, user profile, isLoggedIn |
| **UI state** | Zustand / local state | Modal open/close, tab index |
| **Form state** | React Hook Form / local | Login form, search input |
| **Session state** | Zustand | Lesson đang học, câu hỏi hiện tại |

### Zustand pattern

```ts
// store/useUserStore.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface UserState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  // Actions
  setUser: (user: User) => void
  setToken: (token: string) => void
  logout: () => void
  login: (email: string, password: string) => Promise<void>
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user) => set({ user, isAuthenticated: true }),
      setToken: (token) => set({ token }),

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false })
        AsyncStorage.removeItem('user-storage')
      },

      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const { token, user } = await authService.login(email, password)
          set({ user, token, isAuthenticated: true, isLoading: false })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },
    }),
    {
      name: 'user-storage',         // Key trong AsyncStorage
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({    // Chỉ persist những field cần
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
```

### React Query pattern

```ts
// hooks/useContent.ts
import { useQuery, useMutation } from '@tanstack/react-query'
import { contentService } from '@/features/content/services/contentService'

// Query
export function useLessonBundle(lessonId: string) {
  return useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => contentService.getLessonBundle(lessonId),
    staleTime: 5 * 60 * 1000,     // 5 phút mới gọi lại API
    gcTime: 24 * 60 * 60 * 1000,  // Giữ cache 24h
    enabled: !!lessonId,
  })
}

// Mutation
export function useSubmitLesson() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: SubmitLessonDto) => progressService.submitLesson(data),
    onSuccess: (_, variables) => {
      // Invalidate cache để refresh data
      queryClient.invalidateQueries({ queryKey: ['lesson', variables.lessonId] })
      queryClient.invalidateQueries({ queryKey: ['progress-summary'] })
    },
  })
}
```

---

## 8. API Calls & Caching

### Axios interceptor pattern

```ts
// services/apiClient.ts
import axios from 'axios'
import { useUserStore } from '@/store/useUserStore'

const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// REQUEST interceptor: Gắn token
apiClient.interceptors.request.use(
  (config) => {
    const token = useUserStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// RESPONSE interceptor: Xử lý lỗi + refresh token
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token hết hạn → logout
      useUserStore.getState().logout()
    }
    return Promise.reject(error)
  }
)

export default apiClient
```

### Offline-first pattern

```ts
// data/contentRepository.ts
import AsyncStorage from '@react-native-async-storage/async-storage'
import { apiClient } from '@/services/apiClient'

const CACHE_TTL = 7 * 24 * 60 * 60 * 1000 // 7 ngày

export async function getContent<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const cached = await AsyncStorage.getItem(key)

  if (cached) {
    const { data, timestamp } = JSON.parse(cached)
    // Luôn trả cache ngay, refresh ngầm nếu cache cũ
    if (Date.now() - timestamp < CACHE_TTL) {
      return data as T
    }
    // Cache cũ: trả cache + fetch ngầm
    fetcher().then((fresh) => {
      AsyncStorage.setItem(key, JSON.stringify({ data: fresh, timestamp: Date.now() }))
    }).catch(() => {}) // Ignore error, vẫn dùng cache
    return data as T
  }

  // Không có cache → fetch + save
  const fresh = await fetcher()
  await AsyncStorage.setItem(key, JSON.stringify({ data: fresh, timestamp: Date.now() }))
  return fresh
}
```

---

## 9. Component thay thế HTML

### HTML → RN Cheat Sheet

```tsx
// HTML: <div class="container">Hello</div>
// RN:
<View style={styles.container}>
  <Text>Hello</Text>
</View>

// HTML: <p>Đây là <strong>văn bản</strong></p>
// RN: (không thể nest strong trong Text string)
<Text style={styles.body}>
  Đây là <Text style={styles.bold}>văn bản</Text>
</Text>

// HTML: <ul><li>Item</li></ul>
// RN:
<FlatList
  data={items}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => (
    <Text style={styles.item}>{item.name}</Text>
  )}
/>

// HTML: <input placeholder="Nhập tên" />
// RN:
<TextInput
  style={styles.input}
  placeholder="Nhập tên"
  value={name}
  onChangeText={setName}
/>

// HTML: <button onClick={handleClick}>Submit</button>
// RN:
<TouchableOpacity style={styles.button} onPress={handleClick}>
  <Text style={styles.buttonText}>Submit</Text>
</TouchableOpacity>

// Hoặc dùng Pressable (linh hoạt hơn):
<Pressable
  style={({ pressed }) => [
    styles.button,
    pressed && styles.buttonPressed,
  ]}
  onPress={handleClick}
>
  {({ pressed }) => (
    <Text style={[styles.buttonText, pressed && styles.buttonTextPressed]}>
      Submit
    </Text>
  )}
</Pressable>

// HTML: <img src="avatar.png" alt="avatar" />
// RN:
<Image
  source={require('@/assets/images/avatar.png')}  // Local
  // hoặc:
  source={{ uri: 'https://example.com/avatar.png' }} // Remote
  style={styles.avatar}
  resizeMode="cover"
/>

// HTML: <a href="/profile">Profile</a>
// RN:
import { Link } from 'expo-router'
<Link href="/profile" style={styles.link}>
  <Text>Profile</Text>
</Link>
// Hoặc:
import { router } from 'expo-router'
<TouchableOpacity onPress={() => router.push('/profile')}>
  <Text>Profile</Text>
</TouchableOpacity>

// HTML: <div onScroll={handleScroll}>...</div>
// RN:
<ScrollView
  onScroll={handleScroll}
  scrollEventThrottle={16}
  showsVerticalScrollIndicator={false}
>
  {/* Content */}
</ScrollView>
```

### ScrollView vs FlatList

```tsx
// ScrollView — tải hết tất cả content (dùng cho content ngắn)
<ScrollView>
  <Card />
  <Card />
  <Card /> {/* Tất cả render cùng lúc */}
</ScrollView>

// FlatList — virtualized (dùng cho list dài, chỉ render visible items)
<FlatList
  data={lessons}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => <LessonCard lesson={item} />}
  ListHeaderComponent={<Header />}
  ListEmptyComponent={<EmptyState />}
  onEndReached={loadMore}
  onEndReachedThreshold={0.5}
/>
```

---

## 10. Offline & Storage

### Các loại storage trong RN

| Storage | Use case | Ví dụ |
|---------|----------|-------|
| **AsyncStorage** | Key-value (nhẹ) | Token, settings, cache |
| **AsyncStorage + Zustand persist** | State persistence | User store |
| **React Query cache** | Server state cache | Lesson data |
| **expo-file-system** | File download | Audio, images |
| **expo-sqlite** | Local DB (quan hệ) | Offline dictionary |
| **WatermelonDB** | Local DB (lớn, sync) | Enterprise offline |

### Pattern: Offline-first với React Query

```tsx
// React Query mặc định đã cache
// Thêm persistence để cache tồn tại qua app restart

import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'REACT_QUERY_OFFLINE_CACHE',
})

export default function App() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
    >
      {/* App content */}
    </PersistQueryClientProvider>
  )
}
```

---

## 11. Platform-specific code

### Cách xử lý khác biệt iOS / Android

```tsx
import { Platform, StatusBar } from 'react-native'

// Cách 1: Platform.select
const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.select({
      ios: 0,
      android: StatusBar.currentHeight,
    }),
  },
})

// Cách 2: Platform.OS
if (Platform.OS === 'ios') {
  // iOS-specific logic
}

// Cách 3: File extension (.ios.tsx / .android.tsx)
// Button.ios.tsx → dùng cho iOS
// Button.android.tsx → dùng cho Android
// Button.tsx → fallback
import Button from './Button' // Auto-select based on platform
```

### Safe Area (notch iPhone)

```tsx
import { SafeAreaView } from 'react-native-safe-area-context'

// Wrap cả app (đã làm trong _layout.tsx)
<SafeAreaView style={{ flex: 1 }}>
  {/* Content — tránh notch iPhone */}
</SafeAreaView>

// Hoặc dùng useSafeAreaInsets để custom padding
const insets = useSafeAreaInsets()
// insets.top, insets.bottom, insets.left, insets.right
```

---

## 12. Debugging & Development

### Công cụ

| Công cụ | Mục đích |
|---------|----------|
| **Expo Go** | Test trên thiết bị thật (scan QR) |
| **Expo Dev Tools** | Debug, inspect components |
| **React Native DevTools** | Profiler, Components tree |
| **React Query DevTools** | Theo dõi cache, query |
| **Flipper** | Network, logs, layout debug |
| **VS Code + ESLint** | Lint code |

### Hot Reload

Expo hỗ trợ **Fast Refresh** mặc định. Sửa code → tự động reload (giữ nguyên state).

### Console.log

```tsx
// Bật debug remote JS (Expo Go) để xem console trên máy tính
console.log('Debug:', data)

// Hoặc dùng Reactotron / Flipper cho debug nâng cao
```

---

## Tóm tắt: React Web → React Native

| Bạn biết (Web) | Chuyển sang (Mobile) |
|----------------|---------------------|
| `<div>` | `<View>` |
| `<p>` / `<span>` | `<Text>` |
| `<input>` | `<TextInput>` |
| `<ul>` / `<li>` | `<FlatList>` / `<SectionList>` |
| `<a>` / react-router | `expo-router` (`<Link>`, `router.push()`) |
| CSS | `StyleSheet.create()` — object-based |
| CSS hover | `<Pressable>` với `{pressed}` state |
| CSS media query | `Dimensions.get('window')` |
| onClick | `onPress` |
| onSubmit | `onSubmitEditing` (TextInput) |
| localStorage | `AsyncStorage` |
| fetch / axios | fetch / axios (giống web) |
| localStorage | `@react-native-async-storage/async-storage` |
| Webpack / Vite | Metro bundler (tích hợp sẵn) |

---

## Mẫu: Component RN hoàn chỉnh

```tsx
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, spacing, typography, borderRadius } from '@/constants/theme'

interface ButtonProps {
  title: string
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  icon?: keyof typeof Ionicons.glyphMap
  onPress: () => void
  loading?: boolean
  disabled?: boolean
}

export default function Button({
  title,
  variant = 'primary',
  size = 'md',
  icon,
  onPress,
  loading = false,
  disabled = false,
}: ButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={20} color="#fff" style={styles.icon} />}
          <Text style={[styles.text, variant === 'outline' && styles.outlineText]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.secondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  size_sm: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  size_md: {
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.lg,
  },
  size_lg: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  disabled: {
    opacity: 0.5,
  },
  icon: {
    marginRight: spacing.xs,
  },
  text: {
    color: '#fff',
    ...typography.body,
    fontWeight: '600',
  },
  outlineText: {
    color: colors.primary,
  },
})
```

---

> **Tài liệu tham khảo:**
> - [React Native Docs](https://reactnative.dev/docs/getting-started)
> - [Expo Docs](https://docs.expo.dev/)
> - [Expo Router Docs](https://docs.expo.dev/router/introduction/)
> - [Zustand](https://github.com/pmndrs/zustand)
> - [TanStack Query](https://tanstack.com/query/latest)
