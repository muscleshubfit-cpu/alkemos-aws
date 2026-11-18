# Google الرسمية لنطاقات IP للزواحف — مرجع مثبّت (تاريخ السحب 2026-11-18)

> **الغرض:** هذه هي المادة الخام لآلية التحقق الرسمية من هوية Googlebot (ملحق
> `02-evidence-correction-and-audit.md` §2). القانون: **User-Agent وحده ليس دليلًا
> أبدًا** — التحقق الرسمي بطريقتين حصرًا وفق مستند «Verify Googlebot» الرسمي
> (قُرئ حيًا 2026-11-18):
> 1. **reverse DNS بالاتجاهين:** عنوان IP ← اسم مضيف ينتهي بقناع Google الرسمي،
>    ثم إعادة الحل الأمامية للاسم يجب أن تعود إلى الـIP نفسه.
> 2. **مطابقة النطاقات المنشورة** بالملفات الخمسة أدناه.

## الملفات الخمسة كما يقيّدها المستند الرسمي

| الملف | البادئات | الفئة الرسمية | أقنعة reverse DNS |
|---|---|---|---|
| `common-crawlers.json` | 317 | الزواحف العامة (Googlebot وGooglebot-News/Images/Video — **وقناة الزحف النصي والصوري خاصتنا**) | `crawl-***-***-***-***.googlebot.com` أو `geo-crawl-***-***-***-***.geo.googlebot.com` |
| `special-crawlers.json` | 272 | زواحف الحالات الخاصة (AdsBot ونحوها — اتفاق وصول/فحص إساءة) | `rate-limited-proxy-***-***-***-***.google.com` |
| `user-triggered-agents.json` | 20 | وكلاء يطلقهم المستخدم | — |
| `user-triggered-fetchers-google.json` | 504 | جالبات يطلقها المستخدم تتحكم بها Google (مثل Google Site Verifier — **وفئتها المحتملة Google-InspectionTool**) | تحل إلى اسم مضيف `google.com` |
| `user-triggered-fetchers.json` | 1,088 | جالبات يطلقها المستخدم من خارج Google (GCP) | تحل إلى `gae.googleusercontent.com` |

**SHA-256 (تثبيت النسخة):**

```
2ff3b3f6a41544fde3682d2b1e5b896ddfb961d708ee2e01a5267351ca95c52b  common-crawlers.json
ab7950f98097cabc232f9bf04dd5c2f5d907d709698a7fcba9cc08cea2861ae1  special-crawlers.json
01ed2504349c79dd2a05a95a430e047afab0d4bb8a7f07e72d6402e095c01ae1  user-triggered-agents.json
91e65651e93847446d6b27fd217b595f6e3fb5f7919e72b4367c17de29640872  user-triggered-fetchers-google.json
b6dd6fa58460a87147b6ceb98360eee7f4e6668f6e07d99dbf4a18a8faa27eda  user-triggered-fetchers.json
```

- المصدر: `https://developers.google.com/static/crawling/ipranges/<name>.json`
  (وقّت إنشاء النسخ عند Google: 2026-11-18 15:45 UTC — أحدث من التدقيق).
- **ملاحظة تسمية موثقة:** الرابط القديم `.../ipranges/googlebot.json` أصبح
  **تحويلة** إلى `common-crawlers.json` — Google أعادت تسمية الملف؛ أي مرجع
  قديم باسم googlebot.json يقصد الملف الأول أعلاه.
- أدوات التحقق القابلة للتشغيل: `../scripts/cf_googlebot_identity_verify.py`
  (يسحب clientIP/ASN/المسار من Cloudflare GraphQL ثم يطبق الطريقتين الرسميتين).
