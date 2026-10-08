# AJ Class A — دليل التشغيل (عربي)

تطبيق Android حقيقي: Kotlin + XML + Material3 + Firebase + AI REST.

## 1) المتطلبات
- Android Studio Hedgehog+
- JDK 17
- مشروع Firebase جديد + تطبيق Android بالحزمة `com.ajclassa.app`

## 2) التركيب (5 دقائق)
1. حمّل `google-services.json` من Firebase Console وضعه في `app/google-services.json` (يوجد ملف مؤقت يجب استبداله).
2. فعّل في Firebase: Authentication (Email/Password) + Firestore + Storage + Cloud Messaging.
3. انشر القواعد:
   - `firebase deploy --only firestore:rules`
   - `firebase deploy --only storage:rules`
4. أنشئ مستند Owner في `users` (سجّل دخول مرة ثم عدّل):
   - `email = aboudyhassoun3@gmail.com`, `role = OWNER`, `active = true`, `username` من اختيارك.
5. ابنِ وشغّل: `./gradlew assembleDebug`

## 3) إعداد AI (بدون مفتاح داخل APK)
- Owner يضبط `AI API URL` و`Model` من الإعدادات داخل التطبيق (تُحفظ في SharedPreferences وتُزامَن مع `settings/ai`).
- كل طلبات AI تمر عبر الـ Proxy الآمن (`AI_DEFAULT_BASE_URL`). لا يوجد أي `API Key` مكشوف في الكود.
- لدعم مزود آخر (A/B/C): غيّر الـ Base URL فقط — الواجهة `AiApiService` ثابتة.

## 4) إنشاء حسابات الطلاب
- Owner/Admin → لوحة الإدارة → إنشاء مستخدم (الاسم/Username/Email/Password/Role).
- ملاحظة أمان: إنشاء مستخدمي Auth يتم عبر Backend آمن (Admin SDK). التطبيق ينشئ ملف Firestore مع `mustChangePassword=true` ثم تُربط المصادقة من الـ Backend.

## 5) هيكل Firestore
`users, subjects, lessons, homework, submissions, exams, examResults, questionBank, announcements, schedule, communityMessages, aiChats/{chatId}/messages, notes, notifications, libraryFiles, auditLogs, settings, permissions`

## 6) الأمان
- التحقق من الصلاحيات في 3 طبقات: UI + Repository/Guards + Firestore/Storage Rules.
- سجلات الإدارة في `auditLogs` ولا يراها الطلاب.
