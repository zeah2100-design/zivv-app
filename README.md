# zivv - Native App Build Guide

## 📱 بناء تطبيق Android (.apk / .aab)

### الخطوة 1: تثبيت المتطلبات
```bash
# 1. Node.js 18+ (لديك)
# 2. Java JDK 17
# 3. Android Studio: https://developer.android.com/studio
# 4. Android SDK 33+
```

### الخطوة 2: بناء Next.js
```bash
npm install
npm run build
# هذا ينشئ مجلد 'out/' يحتوي على الموقع الثابت
```

### الخطوة 3: إضافة Capacitor
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap add android
npx cap sync android
```

### الخطوة 4: فتح Android Studio
```bash
npx cap open android
```

### الخطوة 5: بناء APK
1. في Android Studio: **Build** → **Generate Signed Bundle / APK**
2. اختر **APK** (للتثبيت المباشر) أو **AAB** (لـ Google Play)
3. أنشئ keystore جديد:
   - **Path**: `android/app/zivv-release.keystore`
   - **Password**: `zivv2026` (غيّره!)
   - **Alias**: `zivv`
4. اضغط **Finish**

### الخطوة 6: نتيجة
- **APK**: `android/app/release/app-release.apk` (~15-20MB)
- **AAB**: `android/app/release/app-release.aab` (لـ Google Play)

### الخطوة 7: التثبيت على الجهاز
```bash
adb install android/app/release/app-release.apk
```

---

## 🍎 بناء تطبيق iOS (.ipa)

### الخطوة 1: متطلبات macOS فقط
```bash
# 1. macOS (ليس Windows)
# 2. Xcode 15+
# 3. CocoaPods: sudo gem install cocoapods
```

### الخطوة 2: إضافة iOS
```bash
npm install @capacitor/ios
npx cap add ios
npx cap sync ios
```

### الخطوة 3: فتح Xcode
```bash
npx cap open ios
```

### الخطوة 4: بناء IPA
1. في Xcode: **Product** → **Archive**
2. اضغط **Distribute App** → **App Store Connect / Ad-hoc**
3. اختر **Development Team** (أنشئ واحد في https://developer.apple.com)
4. **Export**

---

## 🚀 النشر على Google Play

1. **إنشاء حساب مطور**: https://play.google.com/console ($25 مرة واحدة)
2. **إنشاء تطبيق جديد** في Play Console
3. **Store Listing**: 
   - اسم: zivv
   - وصف: منصة تواصل اجتماعي ذكية
   - أيقونة 512x512
   - Screenshots
4. **رفع AAB** (App Bundle) - من `android/app/release/app-release.aab`
5. **Pricing & Distribution**: مجاني
6. **Submit for Review**

---

## 🚀 النشر على App Store

1. **Apple Developer Program**: $99/سنة
2. **App Store Connect**: https://appstoreconnect.apple.com
3. **إنشاء تطبيق جديد**
4. **رفع IPA** عبر Xcode أو Transporter
5. **Submit for Review**

---

## 🛠️ متطلبات التطوير

### Android:
- ✅ Android Studio Hedgehog أو أحدث
- ✅ Android SDK 33+
- ✅ Gradle 8+
- ✅ JDK 17

### iOS:
- ✅ macOS Ventura أو أحدث
- ✅ Xcode 15+
- ✅ iOS Deployment Target 13+
- ✅ Apple Developer Account ($99/سنة للنشر)

---

## 🔄 تحديث التطبيق

بعد تعديل الكود:
```bash
npm run build
npx cap sync
npx cap open android  # أو ios
# اضغط Run في Android Studio/Xcode
```

---

## 📊 الأحجام المتوقعة

- **APK**: 15-20 MB
- **AAB**: 12-18 MB
- **IPA**: 20-30 MB

---

## 🎯 نصائح مهمة

1. **غيّر الـ Package Name** (`com.zivv.app`) لاسم فريد خاص بك
2. **غيّر الألوان** في `colors.xml` و `capacitor.config.ts`
3. **أضف أيقونة 1024x1024** (بدون شفافية) في `android/app/src/main/res/`
4. **اختبر** على أجهزة حقيقية قبل النشر
5. **استخدم** ProGuard/R8 لتقليل حجم APK

---

## 🆘 حل المشاكل

### خطأ "SDK not found"
```bash
# في Android Studio:
# File → Project Structure → SDK Location
# حدد مسار Android SDK
```

### خطأ "Build failed"
```bash
cd android
./gradlew clean
cd ..
npx cap sync android
npx cap open android
```

### خطأ "App not installed"
- تأكد من تفعيل "Install from Unknown Sources" في Android
- تأكد من توقيع APK بشكل صحيح

---

## 📞 الدعم

- **Email**: zivv@example.com
- **GitHub**: https://github.com/zeah2100-design/zivv-app
- **Live Demo**: https://zivv-app.vercel.app
