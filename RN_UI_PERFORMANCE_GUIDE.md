# React Native — UI Libraries & Performance Guide

## Mục lục

1. [UI Libraries — Nên dùng cái nào?](#1-ui-libraries)
2. [Performance cơ bản — Tại sao 1 dòng code cũng có thể chậm?](#2-performance-cơ-bản)
3. [StyleSheet vs inline styles — Cái nào nhanh hơn?](#3-stylesheet-vs-inline)
4. [Flexbox & Layout — Tối ưu bố cục](#4-flexbox-layout)
5. [FlatList — Tối ưu list](#5-flatlist)
6. [Image — Tối ưu ảnh](#6-image)
7. [Animation — Reanimated vs Animated](#7-animation)
8. [Re-render — Nguyên nhân số 1 gây chậm](#8-re-render)
9. [Hermes — JS Engine](#9-hermes)
10. [Công cụ đo lường Performance](#10-công-cụ-đo)
11. [Checklist tối ưu](#11-checklist)

---

## 1. UI Libraries

### Bảng so sánh tổng quan

| Library | Stars | Bundle size | Customizability | Performance | Ghi chú |
|---------|-------|-------------|----------------|-------------|---------|
| **NativeWind** (Tailwind for RN) | 27k+ | ~5KB gzipped | ★★★★★ | ★★★★★ | **Khuyên dùng cho 2025+** |
| **Tamagui** | 12k+ | Tree-shakeable | ★★★★★ | ★★★★★ | Universal (RN + Web) |
| **Restyle** (Shopify) | 2.5k+ | ~3KB | ★★★★ | ★★★★★ | Design system utility |
| **React Native Paper** | 13k+ | ~80KB | ★★★ | ★★★ | Material Design 3 |
| **React Native Elements** | 25k+ | ~100KB | ★★★ | ★★★ | Nhiều component sẵn |
| **NativeBase** | 20k+ | ~120KB | ★★★ | ★★ | **Đã chết** (không còn维护) |
| **UI Kitten** | 10k+ | ~90KB | ★★★ | ★★★ | Eva Design System |
| **ShadCN RN** | 10k+ | Tree-shakeable | ★★★★★ | ★★★★★ | Mới nổi, đang hot |

### Chi tiết từng thư viện

---

### 🥇 NativeWind (Khuyên dùng số 1)

**Triết lý:** Tailwind CSS cho React Native. Viết className thay vì StyleSheet.

```tsx
// CÁCH CŨ (StyleSheet):
<View style={styles.container}>
  <Text style={styles.title}>Hello</Text>
</View>

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
// CÁCH NativeWind:
<View className="flex-1 bg-white px-4 py-6">
  <Text className="text-2xl font-bold text-gray-800">Hello</Text>
</View>
```

**Vì sao NativeWind là lựa chọn tốt nhất?**

| Tiêu chí | Lý do |
|----------|-------|
| **Năng suất** | Viết nhanh hơn 3x, không cần qua lại giữa JSX và StyleSheet |
| **Bundle size** | ~5KB gzipped, tree-shakeable, purge unused classes |
| **Performance** | Compile-time (không runtime class generation), dùng StyleSheet.create() bên dưới |
| **Design system** | Dễ dàng custom theme: `colors.primary: '#FF6B35'` |
| **Ecosystem** | Tailwind ecosystem: plugins, tools, intellisense |
| **Team** | Dễ đọc, dễ maintain, không cần nghĩ tên style |
| **Web** | Có thể dùng chung với Next.js (Universal) |

**Cài đặt:**
```bash
npx expo install nativewind
npm install --save-dev tailwindcss
npx tailwindcss init
```

**Config:**
```js
// tailwind.config.js
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#FF6B35',
        secondary: '#004E89',
      },
    },
  },
}
```

**Nhược điểm:**
- Phải học Tailwind (nếu chưa biết)
- Complex layout đôi khi vẫn cần StyleSheet

---

### 🥈 Tamagui

**Triết lý:** Universal UI framework cho RN + Web. Tối ưu performance tận gốc.

```tsx
import { YStack, XStack, Text, Button } from 'tamagui'

export default function Screen() {
  return (
    <YStack flex={1} backgroundColor="$background" padding="$4">
      <XStack justifyContent="space-between">
        <Text fontSize="$6" fontWeight="700">Hello</Text>
        <Button theme="primary">Press me</Button>
      </XStack>
    </YStack>
  )
}
```

**Điểm mạnh:**
- **Static extraction**: Compile JSX thành StyleSheet.create() và FlatComponent (không runtime)
- **Theme system**: Mạnh nhất, support dark mode, dynamic themes
- **Universal**: Một codebase cho iOS + Android + Web
- **Performance**: Tối ưu hơn cả StyleSheet tay vì dùng static extraction

**Điểm yếu:**
- Learning curve cao (phải hiểu concepts)
- Setup phức tạp
- Overkill cho app nhỏ
- Cộng đồng còn nhỏ

---

### 🥉 Restyle (Shopify)

**Triết lý:** Utility-first design system builder.

```tsx
import { createBox, createText, createTheme } from '@shopify/restyle'

const theme = createTheme({
  colors: { primary: '#FF6B35', text: '#2C3E50' },
  spacing: { sm: 8, md: 16 },
  textVariants: { header: { fontSize: 24, fontWeight: '700' } },
})

const Box = createBox<Theme>()
const Text = createText<Theme>()

// Dùng:
<Box flex={1} backgroundColor="primary" padding="md">
  <Text variant="header">Hello</Text>
</Box>
```

**Điểm mạnh:**
- **TypeScript-first**: Full type safety, autocomplete
- **Nhẹ**: Chỉ là utility functions
- **Dễ custom**: 100% control

**Điểm yếu:**
- Không có component sẵn (Button, Card...)
- Phải tự build mọi thứ

---

### Khi nào dùng thư viện UI component sẵn?

Nếu bạn **không muốn tự design**, cần component có sẵn (DatePicker, BottomSheet, Dialog...):

**React Native Paper** (Material Design 3):
```tsx
import { Button, Card, Text, BottomNavigation } from 'react-native-paper'

<Button icon="camera" mode="contained" onPress={() => {}}>
  Press me
</Button>
```

**Khi nào dùng:**
- MVP cần nhanh, không quan tâm design custom
- App nội bộ (internal tool)
- Material Design là đủ

**Khi nào KHÔNG dùng:**
- App cần brand identity riêng
- Performance-critical (Paper có nhiều overhead)
- Animation phức tạp

---

### Khuyến nghị cho Chinese4VN

```
NativeWind (styling)
    + tự build component (Button, Card, Modal...)
    + hoặc kết hợp tamagui nếu cần Universal
```

Lý do:
- App fitness/health không cần component phức tạp
- Cần custom design (không Material)
- NativeWind cho dev speed
- Tự build component cho performance control

---

## 2. Performance cơ bản

### React Native chậm hơn React Web như thế nào?

```
React Web:
  Component → Virtual DOM → Real DOM (nhanh, browser tự tối ưu)

React Native:
  Component → Virtual Tree → JSON Bridge/JSI → Native Widget (chậm hơn)
```

**Mỗi lần re-render** = JS thread gửi dữ liệu qua native thread. Càng ít re-render, càng nhanh.

### "Chỉ 1 dòng code cũng nhanh hơn" — Ý nghĩa là gì?

Đây là nói về **function declaration vs arrow function** trong `render`:

```tsx
// ❌ CHẬM: Arrow function mới mỗi lần render
<FlatList
  renderItem={({ item }) => <Text>{item.name}</Text>} // Hàm mới mỗi render
  keyExtractor={(item) => item.id}                     // Hàm mới mỗi render
/>

// ✅ NHANH: Function bên ngoài, không tạo lại
const renderItem = ({ item }) => <Text>{item.name}</Text>
const keyExtractor = (item) => item.id

<FlatList
  renderItem={renderItem}
  keyExtractor={keyExtractor}
/>
```

**Tại sao?** Mỗi lần component render, nếu bạn viết inline arrow function, nó tạo ra 1 function mới trong memory. FlatList không thể detect "hàm giống nhau" → không tối ưu được.

### Vậy "khai báo 1 dòng" nào thì nhanh?

```tsx
// ❌ CHẬM: useCallback với dependencies () => () không cần thiết
const handlePress = useCallback(() => {
  doSomething()
}, []) // useCallback ở đây là thừa

// ✅ NHANH: Function bên ngoài component
const handlePress = () => {
  doSomething()
}
```

**Nhiều người lạm dụng `useCallback` và `useMemo`**, thực tế nó còn chậm hơn vì:
- Tốn memory để cache
- Tốn CPU để so sánh dependencies
- GC (garbage collection) overhead

**Rule of thumb:**
- Không wrap trong `useCallback`/`useMemo` nếu component không re-render nhiều
- Chỉ dùng khi component đó là child của component cha hay re-render

---

## 3. StyleSheet vs Inline Styles

### Cái nào nhanh hơn?

**StyleSheet.create() ✅ (nhanh hơn)**

```tsx
// ✅ StyleSheet.create — NHANH (được khuyên dùng)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'red' },
})

// Chỉ tạo 1 lần, reference ổn định
<View style={styles.container} />

// ❌ Inline style — CHẬM HƠN
<View style={{ flex: 1, backgroundColor: 'red' }} />
// Tạo object mới mỗi lần render → object allocation → GC
```

**Tại sao StyleSheet.create nhanh hơn?**

| Khía cạnh | StyleSheet.create | Inline object |
|-----------|-------------------|---------------|
| **Object identity** | Same reference mỗi lần render | New object mỗi lần render |
| **Memory** | Tạo 1 lần, không bao giờ đổi | Tạo mới + GC liên tục |
| **Native** | Gửi ID số qua bridge (nhanh) | Gửi cả object JSON qua bridge (chậm) |
| **Optimization** | RN tối ưu native style lookup | Không tối ưu được |

### Khi nào dùng inline?

```tsx
// ✅ Dùng inline KHI dynamic
<View style={[styles.base, { backgroundColor: isActive ? 'blue' : 'gray' }]} />

// ✅ Kết hợp: style cố định trong StyleSheet, dynamic dùng inline
const styles = StyleSheet.create({
  base: { width: 100, height: 100, borderRadius: 12 },
})

// ✅ Hay pattern:
const dynamicStyles = useMemo(
  () => ({ backgroundColor: isActive ? 'blue' : 'gray' }),
  [isActive]
)
<View style={[styles.base, dynamicStyles]} />
```

---

## 4. Flexbox & Layout

### Layout càng sâu, càng chậm

```tsx
// ❌ SÂU, CHẬM: 6 layout passes
<View style={{ flex: 1 }}>
  <View style={{ flexDirection: 'row' }}>
    <View style={{ flex: 1 }}>
      <View style={{ padding: 16 }}>
        <Text>Hello</Text>
      </View>
    </View>
  </View>
</View>

// ✅ NÔNG, NHANH: 2 layout passes
<View style={{ flex: 1, flexDirection: 'row', padding: 16 }}>
  <Text>Hello</Text>
</View>
```

**Mỗi View = 1 layout calculation**. Yoga (layout engine) phải tính toán cho mỗi View.

### Các thuộc tính gây re-layout

| Thuộc tính | Mức độ nặng |
|------------|-------------|
| `width` / `height` | Nhẹ |
| `padding` / `margin` | Nhẹ |
| `flex` / `flexDirection` | Trung bình |
| `position: 'absolute'` | Trung bình |
| **`transform`** | **Rất nhẹ** (chạy trên GPU, không re-layout) |

### Dùng transform thay vì layout

```tsx
// ❌ Re-layout mỗi lần đổi vị trí
<View style={{ marginLeft: offset }} />

// ✅ Chạy trên GPU, không re-layout
<View style={{ transform: [{ translateX: offset }] }} />
```

**Nguyên tắc:** Nếu animate vị trí/kích thước, luôn dùng `transform` thay vì `width/height/margin/padding`.

---

## 5. FlatList

### Tại sao FlatList nhanh hơn ScrollView?

```
ScrollView: Render TẤT CẢ item cùng lúc
  ├── Item 1 (visible)
  ├── Item 2 (visible)
  ├── Item 3 (visible)
  ├── Item 4 (OFF-screen, vẫn render) ← WASTED
  ├── Item 5 (OFF-screen, vẫn render) ← WASTED
  └── ...

FlatList: Render ONLY visible items + window
  ├── Item 1 (visible)
  ├── Item 2 (visible)
  ├── Item 3 (visible)
  └── [KHÔNG render item ngoài màn hình]
```

### Tối ưu FlatList

```tsx
// ✅ TỐI ƯU NHẤT
<FlatList
  data={items}
  renderItem={renderItem}          // Hàm bên ngoài, không inline
  keyExtractor={keyExtractor}      // Hàm bên ngoài, không inline
  initialNumToRender={5}           // Chỉ render 5 item đầu
  maxToRenderPerBatch={5}          // Tối đa 5 item mỗi batch
  windowSize={3}                   // Mỗi bên 3 màn hình (mặc định 21!)
  removeClippedSubviews={true}     // Remove view ngoài màn hình
  getItemLayout={getItemLayout}    // Fixed height → skip measurement
  ItemSeparatorComponent={Separator} // Separator riêng
  ListEmptyComponent={<Empty />}
/>

// Nếu item có height cố định:
const getItemLayout = (_, index) => ({
  length: ITEM_HEIGHT, // Fixed height
  offset: ITEM_HEIGHT * index,
  index,
})
```

### Tối ưu renderItem

```tsx
// ❌ CHẬM: Component mới mỗi lần
const renderItem = ({ item }) => (
  <View style={styles.item}>
    <Text>{item.name}</Text>
    <TouchableOpacity onPress={() => handlePress(item.id)}>
      <Text>Xem</Text>
    </TouchableOpacity>
  </View>
)

// ✅ NHANH: React.memo + callback ổn định
const Item = React.memo(({ item, onPress }) => (
  <View style={styles.item}>
    <Text>{item.name}</Text>
    <TouchableOpacity onPress={onPress}>
      <Text>Xem</Text>
    </TouchableOpacity>
  </View>
))

const renderItem = useCallback(({ item }) => (
  <Item item={item} onPress={handlePress} />
), [handlePress])
```

---

## 6. Image

### Image là một trong những nguyên nhân chính gây chậm

```tsx
// ❌ CHẬM: Load ảnh gốc, không cache
<Image source={{ uri: 'https://example.com/huge-image.jpg' }} />

// ✅ NHANH: Resize trước khi hiển thị
<Image
  source={{
    uri: 'https://example.com/huge-image.jpg',
    cache: 'force-cache',
  }}
  style={{ width: 100, height: 100 }}
  resizeMode="cover"      // Quan trọng: mặc định là 'cover'
/>
```

### Thư viện image tốt nhất: expo-image

```tsx
import { Image } from 'expo-image'

// ✅ expo-image: tự động cache, blurhash, fade in
<Image
  source="https://example.com/image.jpg"
  style={{ width: 100, height: 100 }}
  placeholder={{ blurhash: 'LFE@Gc%MWVxZ~qj[WVj[' }} // Hiện placeholder ngay
  contentFit="cover"
  transition={300}                                     // Fade in 300ms
/>
```

**Tại sao expo-image nhanh hơn Image built-in?**

| Feature | Built-in Image | expo-image |
|---------|---------------|------------|
| Cache | Không tự động | Disk + memory cache |
| Placeholder | Không | Blurhash / thumbhash |
| Transition | Không | Fade in animation |
| Memory management | Kém | Tự động giải phóng |
| Priority | Không | Có (low/normal/high) |
| Preload | Không | `Image.prefetch()` |

### Giảm kích thước ảnh

```tsx
// Tự động resize ảnh với URL parameters (nếu server hỗ trợ)
const getOptimizedImage = (url: string, width: number) => {
  return `${url}?w=${width * 2}&q=80` // *2 cho retina
}

// Prefetch ảnh trước khi render
useEffect(() => {
  Image.prefetch(imageUrls)
}, [])
```

---

## 7. Animation

### Animated API (built-in) vs react-native-reanimated

| Tiêu chí | Animated (built-in) | Reanimated |
|----------|-------------------|------------|
| **Chạy trên thread nào** | JS Thread | UI Thread (native) |
| **Bị block bởi JS** | Có (nếu JS busy, animation giật) | Không (chạy độc lập) |
| **Gesture support** | Kém | Mạnh (với Gesture Handler) |
| **Performance** | ★★★ | ★★★★★ |
| **Bundle size** | 0 (built-in) | ~30KB |
| **API complexity** | Dễ | Trung bình |

### Khi nào dùng cái gì?

```tsx
// ✅ Animation ĐƠN GIẢN (opacity, scale nhẹ) → Animated API là đủ
<Animated.View style={{ opacity: fadeAnim }}>
  <Text>Hello</Text>
</Animated.View>

// ✅ Animation PHỨC TẠP (drag, gesture, spring, path) → Reanimated
import Animated, { useSharedValue, withSpring } from 'react-native-reanimated'

const offset = useSharedValue(0)
const animatedStyles = useAnimatedStyle(() => ({
  transform: [{ translateX: withSpring(offset.value) }],
}))

<Animated.View style={[styles.box, animatedStyles]} />
```

### Tối ưu animation quan trọng nhất: useNativeDriver

```tsx
// ✅ BẮT BUỘC: useNativeDriver khi có thể
Animated.timing(fadeAnim, {
  toValue: 1,
  duration: 300,
  useNativeDriver: true, // Chạy trên UI thread
}).start()

// ❌ useNativeDriver: false → chạy trên JS thread (giật hơn)
Animated.timing(fadeAnim, {
  toValue: 1,
  duration: 300,
  useNativeDriver: false, // JS thread
}).start()
```

**useNativeDriver = true** → animation chạy hoàn toàn trên native, JS thread có bận cũng không ảnh hưởng.

**Hạn chế:** `useNativeDriver` không hỗ trợ `height`, `width`, `top`, `left`. Chỉ hỗ trợ `opacity`, `transform`, `backgroundColor` (trên Android).

---

## 8. Re-render

### Nguyên nhân số 1 gây chậm RN

```tsx
// Component cha re-render → tất cả con re-render
function Parent() {
  const [count, setCount] = useState(0)

  return (
    <View>
      <Text>{count}</Text>
      <Child />          {/* Re-render dù Child không dùng count */}
      <Child />          {/* Re-render dù Child không dùng count */}
      <Child />          {/* Re-render dù Child không dùng count */}
      <Button title="Tăng" onPress={() => setCount(c => c + 1)} />
    </View>
  )
}
```

### Giải pháp: React.memo + useCallback + useMemo

```tsx
// ✅ React.memo: Chỉ re-render khi props thay đổi
const Child = React.memo(({ title }) => {
  return <Text>{title}</Text>
})

function Parent() {
  const [count, setCount] = useState(0)

  // ✅ useCallback: Giữ reference function ổn định
  const handlePress = useCallback(() => {
    setCount(c => c + 1)
  }, [])

  // ✅ useMemo: Giữ reference object ổn định
  const config = useMemo(() => ({
    color: 'blue',
    size: 'large',
  }), [])

  return (
    <View>
      <Text>{count}</Text>
      <Child title="Không re-render" />   {/* OK, không re-render */}
      <Button label="Tăng" onPress={handlePress} /> {/* OK, không re-render nếu Button là React.memo */}
    </View>
  )
}
```

### useCallback / useMemo — Khi nào dùng?

```tsx
// ✅ NÊN dùng useCallback: Khi function là props của React.memo child
<ExpensiveChild onPress={handlePress} />

// ✅ NÊN dùng useMemo: Khi object là props của React.memo child
<ExpensiveChild config={config} />

// ✅ NÊN dùng useMemo: Khi computation nặng
const sorted = useMemo(() => items.sort(compare), [items])

// ❌ KHÔNG cần useCallback: Khi function dùng trong cùng component
<Button onPress={() => setOpen(true)} /> // OK, không cần useCallback

// ❌ KHÔNG cần useMemo: Khi computation đơn giản
const fullName = `${first} ${last}` // OK, không cần useMemo
```

### Phát hiện re-render

```tsx
// Cách 1: React.memo + console.log
const Child = React.memo(({ title }) => {
  console.log(`Render: ${title}`)
  return <Text>{title}</Text>
})

// Cách 2: useWhyDidYouUpdate (debug tool)
// Cách 3: React DevTools Profiler (xem flamegraph)
```

---

## 9. Hermes

### Hermes là gì?

**Hermes** = JavaScript engine của Meta cho RN. Thay thế JavaScriptCore (JSC).

```bash
# Hermes được bật mặc định trong Expo SDK 50+
# Không cần config gì thêm
```

### Hermes vs JSC

| Tiêu chí | JSC (cũ) | Hermes |
|----------|----------|--------|
| **Startup time** | ~1.5s | ~0.3s (nhanh hơn 5x) |
| **App size** | ~15MB (JSC) | ~5MB (Hermes) + ~2MB bytecode |
| **Memory** | Nhiều hơn | Ít hơn ~30% |
| **Bytecode** | Không | Pre-compiled bytecode (nhanh hơn parse) |
| **ES6+ support** | Đầy đủ | Gần đầy đủ |
| **Debug** | Chrome DevTools | Hermes Debugger (thay thế) |

### Tại sao Hermes nhanh hơn?

```
JSC:
  Source Code → Parse AST → JIT Compile → Execute (chậm)

Hermes:
  Source Code → Pre-compiled Bytecode (build-time) → Execute (nhanh)
```

Hermes compile trước JavaScript thành bytecode **lúc build app**, không phải lúc runtime. Giống Java compile thành .class file.

### Kiểm tra Hermes đang chạy

```tsx
import { Platform } from 'react-native'

const isHermes = () => {
  return !!(global as any).HermesInternal
}
```

---

## 10. Công cụ đo lường Performance

### 1. React DevTools Profiler

```bash
# Cài đặt
npx expo install react-devtools

# Chạy
npx react-devtools
```

Xem flamegraph: component nào render lâu, render bao nhiêu lần.

### 2. Flipper (chỉ cho bare RN)

Network inspector, layout inspector, crash reporter.

### 3. Metro — JS bundle size

```bash
# Phân tích bundle size
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output temp.js --assets-dest temp
npx source-map-explorer temp.js
```

### 4. Performance Monitor (built-in)

```tsx
// Bật performance overlay (dev mode)
import Performance from 'react-native-performance'

// Hoặc dùng Expo Dev Tools
```

### 5. Frame Rate

```tsx
// Đo FPS trong app
import { PerformanceObserver, performance } from 'react-native-performance'

const observer = new PerformanceObserver((list) => {
  console.log('FPS:', list.getEntries())
})
observer.observe({ type: 'react-native-render' })
```

### 6. Bundle size analysis

```bash
# expo-analyzer
npx expo-analyzer bundle

# Hoặc
npx react-native-bundle-analyzer
```

---

## 11. Checklist tối ưu

### Render Optimization

- [ ] Dùng `StyleSheet.create()` thay vì inline style cho style cố định
- [ ] `React.memo()` cho component con trong list / hay re-render
- [ ] `useCallback` cho function props của `React.memo` child
- [ ] `useMemo` cho computation nặng + object props
- [ ] Không tạo function/object mới trong render (trừ khi cần)
- [ ] Tránh spread operator trong render (`style={...baseStyle}`)
- [ ] Cố gắng flatten View (bớt nesting)

### List Optimization

- [ ] Dùng `FlatList` thay `ScrollView` cho list dài (>20 items)
- [ ] `keyExtractor` là function bên ngoài component
- [ ] `renderItem` là function bên ngoài, wrap item trong `React.memo`
- [ ] `getItemLayout` nếu item có height cố định
- [ ] `windowSize` = 3 (không phải 21 mặc định)
- [ ] `maxToRenderPerBatch` = 5
- [ ] `removeClippedSubviews = true`

### Image Optimization

- [ ] Dùng `expo-image` thay `Image` built-in
- [ ] Resize ảnh đúng kích thước hiển thị
- [ ] `resizeMode="cover"` (không để mặc định)
- [ ] Prefetch ảnh trước
- [ ] Dùng blurhash/thumbhash cho placeholder
- [ ] Cache ảnh với URL parameters (`?w=200&q=80`)

### Animation Optimization

- [ ] `useNativeDriver: true` cho opacity + transform
- [ ] Dùng `react-native-reanimated` cho animation phức tạp
- [ ] Animate `transform` thay vì `width/height/margin`
- [ ] Layout animation dùng `LayoutAnimation` (Android)

### App-wide

- [ ] Hermes engine (mặc định trong Expo mới)
- [ ] Tree-shaking: chỉ import component cần dùng
- [ ] Lazy load screen / component (React.lazy)
- [ ] Tắt console.log trong production
- [ ] Dùng `InteractionManager.runAfterInteractions` cho heavy task

---

## Tổng kết: Lựa chọn cho Chinese4VN

| Mục | Lựa chọn | Lý do |
|-----|---------|-------|
| **UI Styling** | NativeWind (Tailwind) | Nhanh viết, performance tốt, dễ maintain |
| **Component Library** | Tự build (Button, Card, Modal...) | Control 100% design, nhẹ nhất |
| **Animation** | react-native-reanimated | Cho gesture + flashcard flip |
| **Image** | expo-image | Cache, blurhash, auto optimize |
| **List** | FlatList + React.memo | Virtualized, tối ưu cho lesson list |
| **State** | Zustand (client) + React Query (server) | Nhẹ, đơn giản |
| **Navigator** | Expo Router (file-based) | Giống Next.js |
| **JS Engine** | Hermes (mặc định) | Startup nhanh 5x |

### Nguyên tắc vàng về Performance

```
1. Ít View hơn = nhanh hơn
2. Ít re-render hơn = nhanh hơn
3. Ít JS trên bridge hơn = nhanh hơn
4. Native (useNativeDriver, Reanimated) > JS
5. Đo lường trước khi tối ưu (không đoán mò)
6. Người dùng không quan tâm code của bạn thế nào,
   họ chỉ quan tâm app có mượt không
```
