#!/usr/bin/env python3
# -*- coding: utf-8 -*-
r"""
P0-A evidence runner — إعادة إنتاج قياسات تجربة إحلال التفرد P0-A على SSR حي.

المنهجية مطابقة لحرف توثيق التجربة (02-SAMPLE-AND-METHOD.md §ب):
  1) جلب حي بعناية Googlebot.
  2) حذف script/style ثم الوسوم (P1) — وP2 يضيف حذف تعليقات HTML قبل ذلك.
  3) ترميز كلمي  [\w\u0600-\u06FF']+  (Unicode).
  4) شيغلز 5-gram (مجموعة).
  5) الاحتواء = |A∩B| ÷ min(|A|,|B|).

المخرجات: evidence/p0a_remeasure_results.json (كل القياسات الخام + الأزواج).

حدود الأداة (توثيق صادق):
  - أزواج S0 (الحي) والضوابط والمعايرة تُقاس من صفحات الإنتاج الحية مباشرة.
  - حالات S1→S5 محاكاة نصية: تُستبدل الكتل القديمة (المستخرجة من الحي
    والمتحقق منها مقابل نصوص الكود في src/lib/diet-plan-matrix.ts) بنصوص
    المسودات (03-CONTENT-DRAFTS.md) على مستوى النص المفكوك من الوسوم —
    لا صفحة منشورة. التخطيط والترتيب كما هيا؛ الفروقات العرضية للبايت
    غير ممثلة (انظر 06-REPRODUCIBILITY.md).
"""

import html
import json
import hashlib
import re
import ssl
import sys
import time
import urllib.request
from datetime import datetime, timezone
from itertools import combinations
from pathlib import Path

BASE = "https://alkemos.com"
UA = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
CACHE = Path("/tmp/p0a_cache")
HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]
OUT = HERE / "p0a_remeasure_results.json"
TOKEN_RE = re.compile(r"[\w\u0600-\u06FF']+", re.UNICODE)
CTX = ssl.create_default_context()

LEVELS = [1200, 1500, 1800, 2000, 2500, 3000]
SYSTEMS = ["balanced", "high-protein", "keto", "vegetarian"]
SPLITS = {"balanced": (30, 40, 30), "high-protein": (45, 30, 25),
          "keto": (25, 5, 70), "vegetarian": (25, 50, 25)}
AR_NAMES = {"balanced": ("متوازن", "المتوازن"),
            "high-protein": ("عالي البروتين", "العالي البروتين"),
            "keto": ("كيتوني", "الكيتوني"),
            "vegetarian": ("نباتي", "النباتي")}
SAMPLE = ["en-2500-balanced", "en-2500-keto", "ar-2500-balanced", "ar-3000-balanced"]

# ── المسودات (منسوخة حرفيًا من 03-CONTENT-DRAFTS.md بعد التصحيح
#    الطبي/التحريري 2026-11-11؛ بلا ترقيم أو علامات ** — النص المُصيَّر) ──
D = {}

D["en-2500-balanced"] = {
 "level": "Within this matrix, 2500 calories balanced is the working day of someone who trains four times a week or earns a living with his body. The day on this page lands at 2499 kcal — 594 at breakfast, 879 at lunch, 779 at dinner, 247 as a snack — and the shape matters as much as the total: the two large meals bracket the busiest hours, while bread (41 g) closes breakfast and rice (250 g) closes lunch as the plan's flex items. If your weekly trend disagrees with the number, move it; the structure travels with you.",
 "system": "Here is what a 30/40/30 split looks like when it is food, not arithmetic: 188 g of protein arrive as boiled eggs, chicken breast, tilapia, cottage cheese, and yogurt — five sources, none of them powder; 250 g of carbs ride on baladi bread, white rice, baked potato, and an apple; and the 83 g of fat are mostly poured olive oil plus what the whole foods themselves carry. That is the entire trick of this system at this level: familiar meals, measurable grams, nothing exotic to sustain.",
 "numbers": "Read the macro split against the day above rather than as a separate theory: lunch carries 879 kcal because it fronts the largest carbohydrate serving (250 g of rice), dinner's 779 kcal lean on 250 g of potato, and the snack exists to hold protein and fruit without disturbing the two main meals. Protein at 188 g (750 kcal), carbs at 250 g (1000 kcal), and fat at 83 g (750 kcal) are targets the real foods land close to — inside the tolerance of honest rounding.",
 "faq": [
  "Why does lunch carry the largest share of calories in this plan? — Because it sits at the center of the active day this level assumes: 879 kcal with 250 g of rice places the biggest carbohydrate serving where training, walking, and work actually spend it. If your schedule peaks in the evening instead, moving part of lunch's rice into dinner is a legitimate adjustment — the engine only asks that the day re-lands near 2499 kcal and protein stays near 188 g.",
  "What do the flex items actually do? — Each meal has one item the plan adjusts to close the calorie gap: bread at breakfast, rice at lunch, mixed vegetables at dinner, and yogurt at the snack. When the engine trims or adds grams it starts there — which tells you exactly where to adjust too. Swap a food, keep its role (a starch for a starch, a lean protein for a lean protein), then re-total the day.",
  "The day totals 2499 calories, not 2500 — is that a mistake? — No. Real foods in 5-gram steps cannot hit an arbitrary target to the calorie, so the engine closes every day within a tolerance of roughly 10 kcal. Across a week a 1-kcal daily gap is invisible; weighing the food is what keeps the real error small, not chasing the last calorie on paper.",
  "Can I use this same day on training-rest days? — The day is printed for the training context this level assumes, and it stays the reference: weigh its flex items as printed, and let your weekly weight trend — not a ready formula — tell you whether quiet days need a different shape. When they do, regenerate the day at your verified target: the AI planner rebuilds the same system in grams, and the meal planner lets you hold protein and vegetables while you adjust the starches by hand. What the plan does not reward is eating the training day twice: once for the work and once from habit.",
  "I manage a chronic condition with medication — does this day need a review first? — This page is general planning for healthy adults, and the day itself is ordinary food. The numbers worth bringing to your physician are the daily carbohydrates (250 g) and wherever your sodium sits once seasoning is added — especially with diabetes or hypertension. Treat the plan as a concrete, gram-level discussion piece with your professional, not as a prescription written around your labs.",
 ],
 "cta1": "Two numbers carry this page when you customize it: the day total of 2499 kcal and the protein anchor of 188 g — hold those two and rearrange the rest of the day freely. The fastest route: plan your meals with AI — it regenerates a complete day in grams from your number, system, and preferences, free for everyone. For exact manual control, open the meal planner — it works for visitors, free to try — and enter this plan's items (the 250 g of rice, the tilapia, the measured oils) at your own grams, watching the totals build live until your day lands on target.",
 "cta2": "And if 2500 is not yet a verified number for you, the calorie calculator comes first: honest age, weight, height, and activity — and if your figure lands at a neighboring level, 2000 or 3000, the library already holds that level too.",
 "macro": "The table above and the day plan tell the same story twice — once as targets, once as weighed food. To tune the split itself (more protein, fewer carbs), the macro calculator computes any variant from your calories in copyable grams.",
 "day": "Weights are cooked or ready-to-eat; the eggs are counted after boiling and the rice after cooking, which is why the same food weighs differently raw — weigh it the way the plan prints it.",
}

D["en-2500-keto"] = {
 "level": "At 2500 calories, keto is not a beginner's experiment — it is the version of the system for larger or very active people who already know how to run on fat. This page's day totals 2501 kcal, and its shape differs from every balanced page: breakfast is the fattiest meal at 837 kcal, the four meals sit in a flatter band (837 / 708 / 651 / 305), and 15 g of butter or 23 g of olive oil do the closing work that bread and rice do elsewhere in the matrix.",
 "system": "Read against this day, the 25/5/70 split stops being percentages and becomes 156 g of protein, 31 g of carbs, and 194 g of fat. The 31 g deserve a closer look: they arrive inside avocado (115 g), broccoli (235 g), spinach (235 g), and green salad — fibrous foods that carry their carbohydrates with structure, not sugars that arrive alone. Protein is deliberately moderate: the system spends its calorie budget on fat, and pushing protein up while holding 70% fat means pushing something real out of the day.",
 "numbers": "Nearly three quarters of this day — 1750 of 2501 kcal — rides on 194 g of fat, which is why the measured fats (butter at breakfast and dinner, olive oil at lunch, walnuts and cheddar at the snack) are the plan's real levers: one unmeasured pour can move the day by more than 100 kcal. Protein at 156 g (625 kcal) and carbs at 31 g (125 kcal) are ceilings to respect, not quotas to force.",
 "faq": [
  "Where do the 31 grams of carbs in this day actually come from? — From the plate, not the pantry: avocado, broccoli, cooked spinach, and green salad carry them inside fiber and water. No bread, rice, potato, or fruit appears anywhere in the plan. In practice, staying under the carb ceiling at 2500 calories is rarely about the printed foods — it is about what gets added on top: sauces, milk in coffee, drinks, and a casual taste of the excluded foods.",
  "Is 2500 calories too high for keto fat loss? — For a heavy, highly active man 2500 kcal can be a genuine deficit; for a smaller, sedentary person it can be maintenance or a surplus. The system does not change energy arithmetic — it only changes what fuels it. Run the calorie calculator, take your own number seriously, and let this page serve whoever's number actually is 2500.",
  "What do the adaptation weeks feel like at this fuel level? — The familiar one-to-two-week dip in training output and general crispness still happens, but abundant fuel takes the edge off it compared with running keto at an aggressive deficit. The plan's own lever during those weeks is honest measurement: keep the printed grams and read the weekly trend instead of improvising fixes. If the dip drags past three weeks or feels worse than a rough patch, take it to your physician — a lingering adaptation dip is a review matter, not a grams problem.",
  "Why is butter measured in grams instead of as needed? — Because the measured fats are what close this day to 2501 kcal. Free-pouring butter and oil is the classic way keto days drift several hundred calories upward while everything still looks low-carb. Weigh them like every other item; if you want more fat at breakfast, add it in grams and watch where the day lands.",
  "Does this day need medical sign-off before I start? — More than any other page in this matrix, yes if you take glucose-lowering or blood-pressure medication: a day with 31 g of carbohydrates changes the variables those medications assume. This page is general planning for healthy adults; bring the printed day — 156 g protein, 31 g carbs, 194 g fat — to your physician and let it be the discussion piece, not the prescription.",
 ],
 "cta1": "Customizing a keto day has one rule this page makes visible: protect the fat architecture first — the measured butters and oils are what hold the day at 2501 kcal. Adjust from there: plan your meals with AI regenerates the day from your number and preferences in seconds, free; or open the meal planner — it works for visitors, free to try — and enter this day's items (the avocado, the weighed butter, the walnuts) at your own grams, keeping an eye on the fat total as it builds live.",
 "cta2": "And if 2500 is not your verified number, run the calorie calculator before touching a gram — keto at the wrong calorie level is the most expensive way to learn it; the library holds this system at every level from 1200 to 3000.",
 "macro": "At 70% fat the table above is the whole game: protein at 156 g and carbs at 31 g barely move, while fat carries 1750 kcal. To see this split at a different calorie level, the macro calculator computes it from your calories in copyable grams.",
 "day": "Weights are cooked or ready-to-eat; the salmon and spinach reach the plate cooked and the butter is weighed cold — a 5-gram miss on butter is about 36 kcal, so the scale does the real work here.",
}

D["ar-2500-balanced"] = {
 "level": "في هذه المصفوفة، الـ2500 سعرة بالنظام المتوازن هي يوم العمل لمن يتدرب أربع مرات في الأسبوع أو يعيش على جسده في عمله. يوم هذه الصفحة يهبط على 2499 سعرة موزعة 594 فطورًا و879 غداءً و779 عشاءً و247 وجبة خفيفة — والشكل هنا مهم كالإجمالي: الوجبتان الكبيرتان تحيطان بساعات النشاط، والخبز (41 جم) يغلق الفطور والأرز (250 جم) يغلق الغداء بوصفهما الصنفين المرنين في الخطة. وإذا خالفتك موازين أسبوعك في الرقم فحرّكه — البنية تنتقل معك.",
 "system": "على طعام هذه الصفحة يتوقف كون 30/40/30 نسبًا ويصير أرقامًا محسوسة: 188 جم بروتين تأتي من بيض مسلوق وصدر دجاج وسمك بلطي وجبنة قريش وزبادي — خمسة مصادر بلا مسحوق واحد؛ و250 جم كربوهيدرات يحملها خبز بلدي وأرز أبيض وبطاطس مشوية وتفاحة؛ و83 جم دهن غالبها زيت زيتون مقيس وما تحمله الأطعمة نفسها. هذا كل سر النظام عند هذا المستوى: وجبات مألوفة، غرامات قابلة للوزن، ولا شيء غريبًا يُطلب منك الاستمرار عليه.",
 "numbers": "اقرأ توزيع الماكروز على اليوم أعلاه لا بوصفه نظرية منفصلة: الغداء يحمل 879 سعرة لأنه يقدّم أكبر حصة كربوهيدرات (250 جم أرز)، و779 سعرة العشاء تستند إلى 250 جم بطاطس، والوجبة الخفيفة موجودة لتحفظ البروتين والفاكهة دون أن تمس الوجبتين الرئيسيتين. بروتين 188 جم (750 سعرة) وكربوهيدرات 250 جم (1000 سعرة) ودهون 83 جم (750 سعرة) أهداف يقترب منها الطعام الحقيقي بهامش التقريب الصادق.",
 "faq": [
  "لماذا يحمل الغداء أكبر حصة من سعرات هذه الخطة؟ — لأنه يجلس في قلب اليوم النشط الذي يفترضه هذا المستوى: 879 سعرة مع 250 جم أرز تضع أكبر حصة كربوهيدرات حيث يُصرف الجهد فعلًا في التدريب والعمل والحركة. فإن كان ذروة يومك مسائيًا فمن الشرعي أن تنقل شطرًا من أرز الغداء إلى العشاء — المحرك لا يطلب إلا أن يعود اليوم قريبًا من 2499 سعرة ويبقى البروتين قريبًا من 188 جم.",
  "ماذا تفعل الأصناف المرنة في الخطة؟ — لكل وجبة صنف واحد تعدّل به الخطة إجماليها: الخبز في الفطور، والأرز في الغداء، والخضار المطبوخة في العشاء، والزبادي في الوجبة الخفيفة. حين يزيد المحرك الغرامات أو يقلصها فإنه يبدأ من هنا — وهذا يخبرك أنت أيضًا أين تعدّل. بدّل صنفًا مع حفظ دوره (نشوية مكان نشوية، وبروتين قليل الدهن مكان نظيره) ثم أعد حساب اليوم.",
  "اليوم يبلغ 2499 سعرة لا 2500 بالضبط — أهذا خطأ؟ — لا. الأطعمة الحقيقية بخطوات 5 جم لا تصيب هدفًا اعتباطيًا بالسعرة، لذا يغلق المحرك كل يوم بهامش نحو 10 سعرات. وفي ميزان أسبوع كامل لا يُرى فارق سعرة واحدة يوميًا؛ ما يصغر الخطأ فعليًا هو وزن الطعام لا ملاحقة آخر سعرة على الورق.",
  "هل أستخدم اليوم نفسه في أيام الراحة من التدريب؟ — اليوم مطبوع لسياق التدريب الذي يفترضه هذا المستوى، ويبقى هو المرجع: وزِن أصنافه المرنة كما طُبع، ودَع اتجاه وزنك الأسبوعي — لا معادلة جاهزة — هو من يخبرك إن كانت للأيام الهادئة شكل آخر. وإذا احتاجت فأعد توليد اليوم عند رقمك المتحقق: المخطط بالذكاء الاصطناعي يبني النظام نفسه بالغرامات، ومخطط الوجبات يتركك تحفظ البروتين والخضار وتضبط النشويات بيدك. ما لا تكافئه الخطة هو أكل يوم التدريب مرتين: مرة مقابل الجهد ومرة من العادة.",
  "أعالج حالة مزمنة بأدوية — هل يحتاج هذا اليوم مراجعة أولًا؟ — هذه الصفحة تخطيط عام لبالغين أصحاء، واليوم نفسه طعام عادي. الأرقام التي تستحق أن تصل إلى طبيبك هي الكربوهيدرات اليومية (250 جم) وموضع الصوديوم بعد التوابل والإضافات، خصوصًا مع السكري أو ضغط الدم. اجعل الخطة مادة نقاش بالغرامات مع مختصك، لا وصفة صادرة باسمك.",
 ],
 "cta1": "رقمان يحملان هذه الصفحة عند التخصيص: إجمالي اليوم 2499 سعرة ومرساة البروتين 188 جم — احفظهما وأعد ترتيب بقية اليوم بحرية. أسرع طريق: خطّط وجباتك بالذكاء الاصطناعي — يعيد توليد يوم كامل بالغرامات من رقمك ونظامك وتفضيلاتك في ثوانٍ، مجانًا للجميع. وللتحكم اليدوي الدقيق افتح مخطط الوجبات — يعمل للزوار مجانًا — وأدخل أصناف هذا اليوم (250 جم أرز، وسمك البلطي، والزيوت المقاسة) بغراماتك أنت، وراقب الإجماليات تُبنى لحظيًا حتى يهبط يومك على هدفك.",
 "cta2": "وإن لم يكن 2500 رقمًا متحققًا لديك بعد فحاسبة السعرات أولًا: عمر ووزن وطول ونشاط صادق — وإن هبط رقمك في مستوى مجاور كـ2000 أو 3000 فالمكتبة تضم ذلك المستوى أيضًا.",
 "macro": "الجدول أعلاه وخطة اليوم يقولان الحكاية نفسها مرتين: مرة أهدافًا ومرة طعامًا موزونًا. وإن أردت تغيير التوزيع نفسه — بروتينًا أكثر أو كربوهيدرات أقل — فحاسبة الماكروز تحسبه لك من سعراتك بغرامات قابلة للنسخ.",
 "day": "الأوزان مطبوخة أو جاهزة للأكل؛ البيض يُوزن بعد السلق والأرز بعد الطبخ، ولهذا يختلف وزن الطعام نفسه نيئًا ومطبوخًا — زِنه بالطريقة المطبوعة نفسها.",
}

D["ar-3000-balanced"] = {
 "level": "الـ3000 سعرة المتوازنة هنا ليست إغراقًا بالطعام بل يوم بناء محسوب: 3000 سعرة موزعة 761 فطورًا و1029 غداءً و916 عشاءً و294 وجبة خفيفة. المشكلة العملية عند هذا المستوى ليست المنع بل الحجم — 300 جم أرز في الغداء و300 جم بطاطس في العشاء كمية يواجهها فم حقيقي — ولهذا بُني اليوم على الدهن المقاس (زيت الزيتون في كل وجبة) ووجبة خفيفة مضغوطة تحمل 294 سعرة في حجم صغير. من يصعد إلى هذا المستوى من 2500 لن يجد طعامًا جديدًا؛ سيجد الحصص نفسها أكبر بمقياس واضح.",
 "system": "عند 3000 سعرة تتحول نسب 30/40/30 إلى: 225 جم بروتين (900 سعرة) و300 جم كربوهيدرات (1200 سعرة) و100 جم دهن (900 سعرة). البنية نفسها التي عند 2500 — بيض وخبز وقريش فطورًا، ودجاج وأرز غداءً، وبلطي وبطاطس عشاءً — لكن المقياس تغيّر: +35 جم بيض في الفطور، و+50 جم أرز في الغداء، و+50 جم بطاطس في العشاء. هذا هو أسلوب النظام في الزيادة: تمديد الحصص المألوفة بدل إدخال أطعمة جديدة يحتمل أن جهازك الهضمي لا يعرفها.",
 "numbers": "ميزانية هذا اليوم تُقرأ من طاولة واحدة: الغداء وحده 1029 سعرة لأنه يجمع أكبر بروتين (270 جم دجاج) مع أكبر نشوية (300 جم أرز)، والعشاء 916 سعرة يقاربه ببطاطس 300 جم، والفطور 761 يفتح اليوم ببيض أكثر من أي مستوى أدنى. بروتين 225 جم وكربوهيدرات 300 جم ودهون 100 جم ليست شعارات — كل رقم منها ظاهر في جدول الغرامات أعلاه موزعًا على الوجبات الأربع.",
 "faq": [
  "كيف آكل 3000 سعرة والشبع يوقفني؟ — بالسعرات الرخيصة حجمًا لا بالأطباق الإضافية: زيت الزيتون المقيس (10–15 جم لكل وجبة) يضيف 88–133 سعرة بلا حجم يُذكر، والخبز البلدي كثيف سعريًا مقارنة بالخضار، والزبادي مع التفاحة يجعلان وجبة الخفيفة 294 سعرة في كوب. ابدأ بالطبق الرئيسي كما طُبع، وإن توقف جوعك قبل إغلاق اليوم فالمرجع أولًا هو الأصناف المرنة — لا الحشو بالدهون العشوائية ولا الحلويات.",
  "أين تذهب الزيادة عن 2500 في هذه الخطة؟ — في مقياس الحصص لا في نوع الطعام: بيض الفطور يصعد 190 إلى 225 جم، وخبزها 41 إلى 56 جم، وأرز الغداء 250 إلى 300 جم، وبطاطس العشاء 250 إلى 300 جم، والعشاء كله يرتفع من 779 إلى 916 سعرة. أي أن الفارق كله نحو 500 سعرة موزع على أصناف تعرفها بالفعل — ولهذا يُبنى البناء على هذا القالب بدل وجبات جديدة كل أسبوع.",
  "كم يصعد الوزن الصحيح على هذه الخطة أسبوعيًا؟ — بالاتجاه الأسبوعي لا بقراءة يوم: زِن نفسك بالظروف نفسها وقارن متوسط الأسبوع بالأسبوع، ودَع إيقاع صعودك يستقيم على رقمك المتحقق لا على معدل عام مقتبس. الخطة تقدم بنية الغرامات لهدفها المعلوم (3000 سعرة)، وأما سرعة الوزن المناسبة فتحددها أهدافك ومراجعتك مع مختصك — وإن ظل المتوسط أسبوعين بلا حركة مع التزام صادق فالمراجعة أولًا قبل أي تمديد لليوم من عندك.",
  "هل أحتاج مخفوقات أو مكملات لتغطية هذا اليوم؟ — لا — هذا اليوم يُغلق من المطبخ لا من العلبة: البيض والدجاج والبلطي والقريش تحمل 225 جم بروتين، والأرز والبطاطس والخبز تحمل 300 جم كربوهيدرات، وزيت الزيتون المقيس يوصل الدهون إلى 100 جم. المخفوق خيار راحة في أيام الانشغال لا شرط للبناء، وأي إضافة عليه تُحسب ضمن اليوم لا فوقه.",
  "مع السكري أو ضغط الدم — ما الذي يستحق المراجعة في يوم 3000 سعرة؟ — الكربوهيدرات هنا 300 جم يوميًا موزعة على خبز وأرز وبطاطس وتفاح — رقم يستهدف مراجعة صريحة مع الطبيب عند السكري قبل الاعتماد، ومع أدوية الضغط يبقى موضع الصوديوم والتوابل هو البند الأول. الصفحة تخطيط عام لبالغين أصحاء؛ اجعلها لوحة أرقام محسوسة تناقشها مع مختصك لا بديلًا عن متابعته.",
 ],
 "cta1": "عند البناء رقم واحد يحكم التخصيص: إجمالي اليوم 3000 سعرة — والبروتين 225 جم خط الحماية فوقه. أسرع طريق للحفاظ عليهما: خطّط وجباتك بالذكاء الاصطناعي — يبني يومًا كاملًا بالغرامات من رقمك ونظامك في ثوانٍ مجانًا. ولمَن يريد التحكم يدويًا فمخطط الوجبات — يعمل للزوار مجانًا — يستقبل أصناف هذا اليوم (الـ300 جم أرز، والـ270 جم دجاج، وزيت الزيتون المقاس) بغراماتك أنت وتُبنى الإجماليات لحظيًا لكل وجبة حتى تنطبق ميزانية اليوم على هدفك.",
 "cta2": "وإن كان 3000 تقديرًا أوليًا لا رقمًا متحققًا فحاسبة السعرات تحسمه أولًا — البناء على رقم خاطئ أغلى طريق لاكتساب دهن لا عضل، والمكتبة تضم كل المستويات من 1200 إلى 3000 إن احتاج رقمك مستوى آخر.",
 "macro": "الجدول أعلاه ليس نِسَبًا معلقة بل ميزانية: 900 سعرة بروتين و1200 كربوهيدرات و900 دهون. وإن أردت اختبار توزيع آخر عند سعراتك فحاسبة الماكروز تحسبه لك من سعراتك بغرامات قابلة للنسخ.",
 "day": "الأوزان مطبوخة أو جاهزة للأكل؛ وحين تكون الحصص كبيرة كهذه فإن تقريب 5 جم على الأرز يهز الإجمالي بنحو 7 سعرات فقط — وزن الحصص الكبيرة أسهل تقريبًا من الصغيرة.",
}

# ── الجلب والخطوط ──

def fetch(path: str) -> str:
    CACHE.mkdir(exist_ok=True)
    key = hashlib.sha1(path.encode()).hexdigest()[:16]
    f = CACHE / (key + ".html")
    if f.exists():
        return f.read_text(encoding="utf-8")
    url = BASE + path
    last = None
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=40, context=CTX) as r:
                data = r.read().decode("utf-8", "replace")
            f.write_text(data, encoding="utf-8")
            time.sleep(0.25)
            return data
        except Exception as e:  # noqa: BLE001
            last = e
            time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"fetch failed {url}: {last}")


def strip_tags(h: str, drop_comments: bool) -> str:
    h = re.sub(r"<(script|style)\b[^>]*>.*?</\1>", " ", h, flags=re.S | re.I)
    if drop_comments:
        h = re.sub(r"<!--.*?-->", " ", h, flags=re.S)
    h = re.sub(r"<[^>]+>", " ", h)
    h = html.unescape(h)
    return re.sub(r"\s+", " ", h).strip()


def toks(text: str) -> list:
    return TOKEN_RE.findall(text)


def sh5(tokens: list) -> set:
    return {tuple(tokens[i:i + 5]) for i in range(len(tokens) - 4)} if len(tokens) >= 5 else set()


def containment(h1: str, h2: str, drop_comments: bool = False) -> float:
    A, B = sh5(toks(strip_tags(h1, drop_comments))), sh5(toks(strip_tags(h2, drop_comments)))
    if not A or not B:
        return 0.0
    return round(len(A & B) / min(len(A), len(B)), 4)


def containment_txt(a: str, b: str) -> float:
    A, B = sh5(toks(a)), sh5(toks(b))
    if not A or not B:
        return 0.0
    return round(len(A & B) / min(len(A), len(B)), 4)


def gap_pattern(s: str) -> re.Pattern:
    """نمط مرن: كلمات النص يفصلها أي مقطع غير كلمي (مسافات/ترقيم)."""
    words = toks(s)
    return re.compile(r"[^\w\u0600-\u06FF']+".join(re.escape(w) for w in words))


def replace_block(text: str, old: str, new: str, expect: int, label: str) -> str:
    pat = gap_pattern(old)
    found = len(pat.findall(text))
    if found != expect:
        raise AssertionError(f"[{label}] occurrences {found} != expected {expect}")
    return pat.sub(lambda _m: new, text, count=expect)

# ── النصوص القديمة من الكود (المصدر الحرفي) ──

def parse_lib() -> dict:
    src = (REPO / "src/lib/diet-plan-matrix.ts").read_text(encoding="utf-8")

    def grab(const_name: str) -> dict:
        i = src.index(f"export const {const_name}")
        j = src.index("};", i)
        block = src[i:j]
        out = {}
        for m in re.finditer(r'("?[\w-]+"?):\s*\n?\s*"((?:[^"\\]|\\.)*)"', block):
            out[m.group(1).strip('"')] = m.group(2)
        return out

    return {"AR_L": grab("LEVEL_GUIDANCE"), "AR_S": grab("SYSTEM_GUIDANCE"),
            "EN_L": grab("LEVEL_GUIDANCE_EN"), "EN_S": grab("SYSTEM_GUIDANCE_EN")}


def numbers_para(lang: str, level: int, system: str) -> str:
    p, c, f = SPLITS[system]
    cp, cc, cf = (round(level * p / 100), round(level * c / 100), round(level * f / 100))
    protein, carbs, fat = round(cp / 4), round(cc / 4), round(cf / 9)
    if lang == "en":
        return (f"At {level} calories per day, this system's split means roughly {protein} g of protein "
                f"({cp} calories), around {carbs} g of carbs ({cc} calories), and about {fat} g of fat "
                f"({cf} calories) — and the plan below is built in grams to approach these targets from real food.")
    return (f"على {level} سعرة يوميًا، توزيع هذا النظام يعني: بروتين نحو {protein} غرامًا "
            f"({cp} سعرة)، وكربوهيدرات نحو {carbs} غرامًا ({cc} سعرة)، ودهونًا نحو {fat} غرامًا "
            f"({cf} سعرة) — والخطة أدناه مبنيّة بالغرامات لتقترب من هذه الأهداف من طعام حقيقي.")

# ── مراسي الأقسام ──

def anchors(lang: str, lv: int, sys: str) -> dict:
    """مراسي الأقسام كسلاسل كاملة — تُرمَّز كلميًا بنفس مصنّف النص الحي
    (ملاحظة: ؟ العربية U+061F داخل نطاق [\u0600-\u06FF] فتلتصق بالكلمة
    في الترميز الكلمي الموثق — لذا تُكتب المراسي بعلاماتها الأصلية)."""
    if lang == "en":
        s = sys  # nameEn.lower() == slug
        return {
            "why": f"Why {lv} calories? And when does it fit you?",
            "about": f"About the {s} system",
            "cta": "Make it your plan — free",
            "faq": f"{lv}-calorie {s} plan — common questions",
            "related": "Related plans",
            "macro": f"Macro split at {lv} calories",
            "daycap": "Day total:",
            "macrocap": "This split is the same header",
        }
    n, nd = AR_NAMES[sys]
    return {
        "why": f"لماذا {lv} سعرة؟ ومتى تلائمك؟",
        "about": f"عن النظام {nd}",
        "cta": "اجعلها خطتك أنت — مجانًا",
        "faq": f"أسئلة شائعة عن نظام {lv} سعرة {n}",
        "related": "خطط ذات صلة",
        "macro": f"توزيع الماكروز على {lv} سعرة",
        "daycap": "إجمالي اليوم:",
        "macrocap": "هذا التوزيع هو نفسه ترويسة",
    }


def extract_old_blocks(cell: str, lib: dict) -> dict:
    lang = "ar" if cell.startswith("ar-") else "en"
    lv = int(cell.split("-")[1])
    sys = cell.split("-", 2)[2]
    raw = strip_tags(fetch(cell_path(cell)), drop_comments=True)
    an = anchors(lang, lv, sys)
    pats = {k: gap_pattern(v) for k, v in an.items()}
    m = {k: p.search(raw) for k, p in pats.items()}
    for name, match in m.items():
        if not match:
            raise AssertionError(f"[{cell}] anchor not found: {name}")

    def between(a_key, b_key):
        return raw[m[a_key].end():pats[b_key].search(raw, m[a_key].end()).start()]

    blocks = {
        "level_extracted": between("why", "about"),
        "system_extracted": between("about", "cta"),
        "cta": between("cta", "faq"),
        "faq": between("faq", "related"),
        "macrocap": raw[m["macrocap"].end():m["why"].start()],
        "daycap": raw[m["daycap"].end():m["macro"].start()],
        "numbers": numbers_para(lang, lv, sys),
    }
    # التحقق: النص المستخرج من الحي == النص الحرفي في الكود (مستوى الكلمة)
    L = lib["AR_L" if lang == "ar" else "EN_L"][str(lv)]
    S = lib["AR_S" if lang == "ar" else "EN_S"][sys]
    assert toks(blocks["level_extracted"]) == toks(L), f"[{cell}] level guide mismatch vs lib"
    assert toks(blocks["system_extracted"]) == toks(S), f"[{cell}] system guide mismatch vs lib"
    assert len(gap_pattern(blocks["numbers"]).findall(raw)) == 1, f"[{cell}] numbers para not found exactly once"
    return blocks


def cell_path(cell: str) -> str:
    lang, lv, sys = cell.split("-", 2)
    return f"/diet-plan/{lv}/{sys}" if lang == "en" else f"/ar/diet-plan/{lv}/{sys}"


def simulate(cell: str, blocks: dict, state: str, lib: dict) -> str:
    raw = strip_tags(fetch(cell_path(cell)), drop_comments=True)
    if state == "S0":
        return raw
    lang = "ar" if cell.startswith("ar-") else "en"
    lv = int(cell.split("-")[1])
    sys = cell.split("-", 2)[2]
    d = D[cell]
    ops = []
    if state >= "S1":
        ops.append((lib["AR_L" if lang == "ar" else "EN_L"][str(lv)], d["level"], 2, "level"))
    if state >= "S2":
        ops.append((lib["AR_S" if lang == "ar" else "EN_S"][sys], d["system"], 2, "system"))
    if state >= "S3":
        ops.append((blocks["faq"], " ".join(d["faq"]), 1, "faq"))
    if state >= "S4":
        ops.append((blocks["numbers"], d["numbers"], 1, "numbers"))
    if state >= "S5":
        ops.append((blocks["cta"], d["cta1"] + " " + d["cta2"], 1, "cta"))
        ops.append((blocks["macrocap"], d["macro"], 1, "macrocap"))
        ops.append((blocks["daycap"], d["day"], 1, "daycap"))
    text = raw
    for old, new, expect, label in ops:
        text = replace_block(text, old, new, expect, f"{cell}/{state}/{label}")
    return text

# ── مجموعات الروابط ──

def sitemap_first(name: str, n: int) -> list:
    locs = re.findall(r"<loc>([^<]+)</loc>", fetch(f"/sitemap-{name}.xml"))
    en = sorted(u[len(BASE):] for u in locs if not re.search(r"/ar(/|$)", u))
    return en[:n]


def main() -> None:
    lib = parse_lib()
    results = {"generated_utc": datetime.now(timezone.utc).isoformat(),
               "base": BASE, "ua": UA,
               "method": "5-gram shingles, containment=|A∩B|/min(|A|,|B|), tokens=[\\w\\u0600-\\u06FF']+"}

    # 1) المعايرة (§04-أ) — أزواج حية فقط
    en_bal = [f"/diet-plan/{lv}/balanced" for lv in LEVELS]
    ar_bal = [f"/ar/diet-plan/{lv}/balanced" for lv in LEVELS]
    en_2500 = [f"/diet-plan/2500/{s}" for s in SYSTEMS]
    ar_2500 = [f"/ar/diet-plan/2500/{s}" for s in SYSTEMS]
    tools_en = ["/tools/bmi-calculator", "/tools/body-fat-calculator", "/tools/calorie-calculator", "/tools/macro-calculator"]
    tools_ar = ["/ar" + t for t in tools_en]
    cal = {
        "EN balanced across levels (15)": [containment(fetch(a), fetch(b)) for a, b in combinations(en_bal, 2)],
        "AR balanced across levels (15)": [containment(fetch(a), fetch(b)) for a, b in combinations(ar_bal, 2)],
        "EN @2500 across systems (6)": [containment(fetch(a), fetch(b)) for a, b in combinations(en_2500, 2)],
        "AR @2500 across systems (6)": [containment(fetch(a), fetch(b)) for a, b in combinations(ar_2500, 2)],
        "EN tools (6)": [containment(fetch(a), fetch(b)) for a, b in combinations(tools_en, 2)],
        "AR tools (6)": [containment(fetch(a), fetch(b)) for a, b in combinations(tools_ar, 2)],
        "twin 2500/balanced (1)": [containment(fetch("/diet-plan/2500/balanced"), fetch("/ar/diet-plan/2500/balanced"))],
    }
    results["calibration_live"] = {k: {"mean": round(sum(v) / len(v), 4),
                                       "range": [min(v), max(v)], "pairs": v} for k, v in cal.items()}

    # 1-ب) تكافؤ الأنبوبين P1/P2 على 5 أزواج تمثيلية (§04-أ2)
    eq_pairs = [("/diet-plan/2500/balanced", "/diet-plan/2500/keto"),
                ("/diet-plan/2500/balanced", "/diet-plan/2000/balanced"),
                ("/diet-plan/2500/balanced", "/ar/diet-plan/2500/balanced"),
                ("/ar/diet-plan/2500/balanced", "/ar/diet-plan/3000/balanced"),
                ("/tools/calorie-calculator", "/tools/macro-calculator")]
    results["pipeline_equivalence_P1_vs_P2"] = {
        f"{a} ↔ {b}": {"P1": containment(fetch(a), fetch(b), False),
                       "P2": containment(fetch(a), fetch(b), True)}
        for a, b in eq_pairs}

    # 2) استخراج الكتل القديمة للعينة والتحقق منها مقابل الكود
    old_blocks = {c: extract_old_blocks(c, lib) for c in SAMPLE}
    results["old_block_verification"] = {
        c: {"level_tokens": len(toks(b["level_extracted"])), "system_tokens": len(toks(b["system_extracted"])),
            "faq_tokens": len(toks(b["faq"])), "cta_tokens": len(toks(b["cta"])),
            "numbers_para_verified_against_formula": True,
            "level_and_system_match_src_lib": True}
        for c, b in old_blocks.items()}

    # 3) التدرج S0→S5 على الأزواج الداخلية الست (§04-ج)
    sim_cache = {}
    def sim(cell, state):
        key = (cell, state)
        if key not in sim_cache:
            sim_cache[key] = simulate(cell, old_blocks[cell], state, lib)
        return sim_cache[key]

    grad = {}
    for state in ["S0", "S1", "S2", "S3", "S4", "S5"]:
        p1 = containment_txt(sim("en-2500-balanced", state), sim("en-2500-keto", state))
        p2 = containment_txt(sim("ar-2500-balanced", state), sim("ar-3000-balanced", state))
        cross = [0.0, 0.0, 0.0, 0.0]  # الأزواج العابرة للغة: لا 5-grams مشتركة بين لغتين
        grad[state] = {"en-bal↔en-keto": p1, "ar-2500↔ar-3000": p2,
                       "mean_of_six": round((p1 + p2) / 6, 4)}
    results["gradient_S0_S5_internal_pairs"] = grad

    # 4) أزواج الحافة الاثنا عشر: خلية S5 مقابل أشقاء حية (§04-د)
    edge = [
        ("en-2500-balanced", "/diet-plan/2500/high-protein"),
        ("en-2500-balanced", "/diet-plan/2500/vegetarian"),
        ("en-2500-balanced", "/diet-plan/2000/balanced"),
        ("en-2500-balanced", "/diet-plan/3000/balanced"),
        ("en-2500-keto", "/diet-plan/2500/high-protein"),
        ("en-2500-keto", "/diet-plan/2500/vegetarian"),
        ("ar-2500-balanced", "/ar/diet-plan/2500/high-protein"),
        ("ar-2500-balanced", "/ar/diet-plan/2500/vegetarian"),
        ("ar-2500-balanced", "/ar/diet-plan/2500/keto"),
        ("ar-2500-balanced", "/ar/diet-plan/2000/balanced"),
        ("ar-3000-balanced", "/ar/diet-plan/3000/high-protein"),
        ("ar-3000-balanced", "/ar/diet-plan/2000/balanced"),
    ]
    edge_res = {}
    for cell, sib in edge:
        sib_txt = strip_tags(fetch(sib), drop_comments=True)  # P2 — نفس أنبوب المحاكاة
        edge_res[f"{cell} ↔ {sib}"] = {"S0": containment_txt(sim(cell, "S0"), sib_txt),
                                       "S4": containment_txt(sim(cell, "S4"), sib_txt),
                                       "S5": containment_txt(sim(cell, "S5"), sib_txt)}
    results["edge_pairs_sample_S5_vs_live_siblings"] = edge_res

    # 5) الضوابط الخارجية (§04-هـ) — اختيار حي موثق داخل النتائج
    blog = sitemap_first("blog", 4)
    foods = sitemap_first("foods", 4)
    results["external_controls_live"] = {
        "blog_EN_selection": blog,
        "blog_EN": [containment(fetch(a), fetch(b)) for a, b in combinations(blog, 2)],
        "blog_EN_mean_tokens": round(sum(len(toks(strip_tags(fetch(u), False))) for u in blog) / 4),
        "foods_EN_selection": foods,
        "foods_EN": [containment(fetch(a), fetch(b)) for a, b in combinations(foods, 2)],
        "foods_EN_mean_tokens": round(sum(len(toks(strip_tags(fetch(u), False))) for u in foods) / 4),
        "tools_mean_tokens": round(sum(len(toks(strip_tags(fetch(u), False))) for u in tools_en + tools_ar) / 8),
    }

    # 6) فحوص المسودات نفسها (§04-و)
    def bundle(cell):
        d = D[cell]
        return " ".join([d["level"], d["system"], d["numbers"], " ".join(d["faq"]),
                         d["cta1"], d["cta2"], d["macro"], d["day"]])
    def s5bundle(cell):
        d = D[cell]
        return " ".join([d["cta1"], d["cta2"], d["macro"], d["day"]])
    lv_old = lambda lang, l: lib["AR_L" if lang == "ar" else "EN_L"][str(l)]
    sy_old = lambda lang, s: lib["AR_S" if lang == "ar" else "EN_S"][s]
    num_old = lambda lang, l, s: numbers_para(lang, l, s)
    checks = {
        "bundles en-bal↔en-keto": containment_txt(bundle("en-2500-balanced"), bundle("en-2500-keto")),
        "bundles ar-2500↔ar-3000": containment_txt(bundle("ar-2500-balanced"), bundle("ar-3000-balanced")),
        "bundles en-bal↔ar-2500 (cross-lang)": containment_txt(bundle("en-2500-balanced"), bundle("ar-2500-balanced")),
        "bundles en-keto↔ar-3000 (cross-lang)": containment_txt(bundle("en-2500-keto"), bundle("ar-3000-balanced")),
        "faq en-bal↔en-keto": containment_txt(" ".join(D["en-2500-balanced"]["faq"]), " ".join(D["en-2500-keto"]["faq"])),
        "faq ar-2500↔ar-3000": containment_txt(" ".join(D["ar-2500-balanced"]["faq"]), " ".join(D["ar-3000-balanced"]["faq"])),
        "S5blocks en↔en": containment_txt(s5bundle("en-2500-balanced"), s5bundle("en-2500-keto")),
        "S5blocks ar↔ar": containment_txt(s5bundle("ar-2500-balanced"), s5bundle("ar-3000-balanced")),
        "new-level en-2500 ↔ old en-2500": containment_txt(D["en-2500-balanced"]["level"], lv_old("en", 2500)),
        "new-level ar-2500 ↔ old ar-2500": containment_txt(D["ar-2500-balanced"]["level"], lv_old("ar", 2500)),
        "new-level ar-3000 ↔ old ar-3000": containment_txt(D["ar-3000-balanced"]["level"], lv_old("ar", 3000)),
        "new-system en-bal ↔ old en-bal": containment_txt(D["en-2500-balanced"]["system"], sy_old("en", "balanced")),
        "new-system en-keto ↔ old en-keto": containment_txt(D["en-2500-keto"]["system"], sy_old("en", "keto")),
        "new-system ar-2500 ↔ old ar-bal": containment_txt(D["ar-2500-balanced"]["system"], sy_old("ar", "balanced")),
        "new-system ar-3000 ↔ old ar-bal": containment_txt(D["ar-3000-balanced"]["system"], sy_old("ar", "balanced")),
        "new-numbers en-bal ↔ old en-bal": containment_txt(D["en-2500-balanced"]["numbers"], num_old("en", 2500, "balanced")),
        "new-numbers ar-2500 ↔ old ar-bal": containment_txt(D["ar-2500-balanced"]["numbers"], num_old("ar", 2500, "balanced")),
        "new-numbers ar-3000 ↔ old ar-bal3000": containment_txt(D["ar-3000-balanced"]["numbers"], num_old("ar", 3000, "balanced")),
        "new-cta en-bal ↔ old en-bal": containment_txt(D["en-2500-balanced"]["cta1"] + " " + D["en-2500-balanced"]["cta2"], old_blocks["en-2500-balanced"]["cta"]),
        "new-cta en-keto ↔ old en-keto": containment_txt(D["en-2500-keto"]["cta1"] + " " + D["en-2500-keto"]["cta2"], old_blocks["en-2500-keto"]["cta"]),
        "new-cta ar-2500 ↔ old ar-2500": containment_txt(D["ar-2500-balanced"]["cta1"] + " " + D["ar-2500-balanced"]["cta2"], old_blocks["ar-2500-balanced"]["cta"]),
        "new-cta ar-3000 ↔ old ar-3000": containment_txt(D["ar-3000-balanced"]["cta1"] + " " + D["ar-3000-balanced"]["cta2"], old_blocks["ar-3000-balanced"]["cta"]),
        "new-macrocap en-bal ↔ old": containment_txt(D["en-2500-balanced"]["macro"], old_blocks["en-2500-balanced"]["macrocap"]),
        "new-macrocap en-keto ↔ old": containment_txt(D["en-2500-keto"]["macro"], old_blocks["en-2500-keto"]["macrocap"]),
        "new-macrocap ar-2500 ↔ old": containment_txt(D["ar-2500-balanced"]["macro"], old_blocks["ar-2500-balanced"]["macrocap"]),
        "new-macrocap ar-3000 ↔ old": containment_txt(D["ar-3000-balanced"]["macro"], old_blocks["ar-3000-balanced"]["macrocap"]),
        "new-daycap en-bal ↔ old": containment_txt(D["en-2500-balanced"]["day"], old_blocks["en-2500-balanced"]["daycap"]),
        "new-daycap en-keto ↔ old": containment_txt(D["en-2500-keto"]["day"], old_blocks["en-2500-keto"]["daycap"]),
        "new-daycap ar-2500 ↔ old": containment_txt(D["ar-2500-balanced"]["day"], old_blocks["ar-2500-balanced"]["daycap"]),
        "new-daycap ar-3000 ↔ old": containment_txt(D["ar-3000-balanced"]["day"], old_blocks["ar-3000-balanced"]["daycap"]),
    }
    results["drafts_checks"] = checks

    # 7) عدّ الكلمات S0→S5 (§04-ز)
    wc = {}
    for c in SAMPLE:
        t0, t5 = len(toks(sim(c, "S0"))), len(toks(sim(c, "S5")))
        wc[c] = {"S0": t0, "S5": t5, "delta": t5 - t0, "pct": round((t5 - t0) / t0 * 100, 1)}
    results["word_counts"] = wc

    OUT.write_text(json.dumps(results, ensure_ascii=False, indent=1), encoding="utf-8")

    # تقرير مختصر
    print("== calibration (live S0) ==")
    for k, v in results["calibration_live"].items():
        print(f"  {k}: mean {v['mean']}  range {v['range']}")
    print("== pipeline equivalence ==")
    for k, v in results["pipeline_equivalence_P1_vs_P2"].items():
        print(f"  {k}: P1 {v['P1']} P2 {v['P2']}")
    print("== gradient ==")
    for s, v in grad.items():
        print(f"  {s}: {v['en-bal↔en-keto']} / {v['ar-2500↔ar-3000']}  mean6 {v['mean_of_six']}")
    vals5 = [v["S5"] for v in edge_res.values()]
    print(f"== edge S5: min {min(vals5)} max {max(vals5)} ==")
    for k, v in edge_res.items():
        print(f"  {k}: S0 {v['S0']} S4 {v['S4']} S5 {v['S5']}")
    print("== controls ==")
    for k in ("blog_EN", "foods_EN"):
        v = results["external_controls_live"][k]
        print(f"  {k}: mean {round(sum(v)/len(v),4)} range {[min(v), max(v)]}")
    print("== word counts ==", json.dumps(wc, ensure_ascii=False))
    print("== draft checks ==")
    for k, v in checks.items():
        print(f"  {k}: {v}")
    print(f"\nsaved -> {OUT}")


if __name__ == "__main__":
    sys.exit(main())
