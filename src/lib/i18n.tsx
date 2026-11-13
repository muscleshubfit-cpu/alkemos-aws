"use client";

import {
 createContext,
 useContext,
 useEffect,
 useState,
 useCallback,
 useMemo,
 type Dispatch,
 type ReactNode,
 type SetStateAction,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  isArabicPath,
  isSpecialSurface,
  readStoredLang,
  persistLangChoice,
  healLangStores,
  mirrorPath,
} from "@/lib/surface-locale";

export type Lang = "ar" | "en";

type Dict = Record<string, string>;

const en: Dict = {
 "brand.name": "Alkemos",
 "brand.tagline": "Online fitness & nutrition platform",
 "nav.dashboard": "Dashboard",
 "nav.coach": "AI Coach",
 "nav.questionnaires": "Questionnaires",
 "nav.progress": "Progress",
 "nav.plans": "My Plans",
 "nav.clients": "Clients",
 "nav.support": "Support",
 "nav.support.coach": "Support Inbox",
 "nav.admin": "Payments",
 "nav.logout": "Log out",
 "nav.pricing": "Pricing",
 "nav.referral": "Invite Friends",
 "nav.blog": "Blog",
 "common.save": "Save",
 "common.cancel": "Cancel",
 "common.loading": "Loading…",
 "common.saving": "Saving…",
 "common.saved": "Saved successfully",
 "common.error": "Something went wrong",
 "common.none": "None",
 "common.optional": "optional",
 "common.back": "Back",
 "common.upload": "Upload",
 "common.uploading": "Uploading…",
 "common.download": "Download",
 "common.delete": "Delete",
 "common.search": "Search",
 "common.kg": "kg",
 "common.cm": "cm",
 "common.add": "Add",
 "common.view": "View",
 "common.notes": "Notes",
 "common.date": "Date",
 "common.title": "Title",
 "common.file": "File",
 "common.welcome": "Welcome",
 "common.send": "Send",
 "common.open": "Open",
 "common.close": "Close",

 // landing.* keys REMOVED (content-strategy v1, 2026-09-20): the Phase-202
 // homepage renders 100% inline isAr ternaries in LandingView.tsx — this
 // orphaned dictionary described the retired marketing homepage and carried
 // unproven claims ("Clients coached") and broken Arabic. Dead code deleted.

 "auth.login.title": "Welcome back",
 "auth.login.subtitle": "Log in to your coaching dashboard.",
 "auth.signup.title": "Create your account",
 "auth.signup.subtitle": "Start your transformation today.",
 "auth.email": "Email",
 "auth.password": "Password",
 "auth.fullName": "Full name",
 "auth.phone": "Phone number",
 "auth.signIn": "Log in",
 "auth.signUp": "Sign up",
 "auth.google": "Continue with Google",
 "auth.or": "or",
 "auth.googleError": "Google login failed. Please try again or continue with email.",
 "auth.haveAccount": "Already have an account?",
 "auth.noAccount": "Don't have an account?",
 "auth.toLogin": "Log in",
 "auth.toSignup": "Sign up",
 "auth.welcomeBack": "Logged in successfully",
 "auth.accountCreated": "Account created! Welcome aboard.",
 "auth.demoNotice": "Demo mode — no Supabase keys configured. Your data is stored locally in this browser.",

 "dash.greeting": "Welcome back",
 "dash.subscription": "Subscription",
 "dash.active": "Active",
 "dash.expired": "Expired",
 "dash.notSet": "Not set",
 "dash.daysLeft": "days left",
 "dash.expiresOn": "Expires on",
 "dash.latestWeight": "Latest weight",
 "dash.startWeight": "Starting weight",
 "dash.change": "Change",
 "dash.noWeight": "No weight logged yet",
 "dash.quickActions": "Quick actions",
 "dash.logProgress": "Log progress",
 "dash.viewPlans": "View my plans",
 "dash.fillQuestionnaires": "Complete questionnaires",
 "dash.renewNow": "Renew now",
 "dash.renew": "Renew",
 "dash.openQuestionnaires": "Open questionnaires",
 "dash.startHere": "Start here",
 "dash.startSub": "Three steps to your plan",
 "dash.step1": "Complete the nutrition & fitness questionnaires",
 "dash.step2": "Log your current weight",
 "dash.step3": "Your plan appears here once it's ready",
 "dash.startCta": "Start with the questionnaire",
 "dash.errorLoad": "Couldn't load your dashboard. Check your connection and try again.",
 "dash.retry": "Retry",
 "dash.logWeightToday": "Log today's weight",
 "dash.mealPlans": "Meal plans",
 "dash.workoutPlans": "Workout plans",
 "dash.checkins": "Check-ins",
 "dash.statsOverview": "Your transformation at a glance",

 "q.title": "Questionnaires",
 "q.subtitle": "Help your coach build the perfect plan for you.",
 "q.nutrition": "Nutrition",
 "q.fitness": "Fitness",
 "q.saved": "Questionnaire saved",
 "q.submit": "Submit for review",
 "q.submitted": "Questionnaire submitted! Your coach will review it.",
 "q.status.draft": "Draft",
 "q.status.submitted": "Submitted",
 "q.status.approved": "Approved",
 "q.status.needs_info": "Needs more info",
 "q.lockedNotice": "Your questionnaire is locked while your coach reviews it.",
 "q.needsInfoNotice": "Your coach requested more info. Please update and resubmit.",
 "q.step1": "Nutrition",
 "q.step2": "Fitness",
 "q.step1.desc": "Tell us about your eating habits and goals.",
 "q.step2.desc": "Tell us about your training and lifestyle.",
 "q.step": "Step",
 "q.of": "of",
 "q.next": "Next: Fitness questionnaire",
 "q.back": "Back",
 "q.saveDraft": "Save draft",
 "q.submitAll": "Submit both questionnaires",
 "q.nutritionSaved": "Nutrition questionnaire saved! Now let's do your fitness questionnaire.",
 "q.allSubmitted": "Both questionnaires submitted! Your coach will review them.",
 "q.reviewTitle": "Review before submitting",
 "q.reviewDesc": "Make sure everything looks correct before sending to your coach.",
 "q.required": "Required",
 "q.optional": "Optional",
 "q.fillRequired": "Please fill in all required fields",
 "q.fillGender": "Please select your gender",
 "q.fillBasicInfo": "Please fill in: Gender, Age, Height, Weight, and Target weight",
 "q.fillFitnessBasic": "Please fill in: Goal, Activity level, and Training days",
 "q.n.age": "Age",
 "q.n.gender": "Gender",
 "q.n.gender.male": "Male",
 "q.n.gender.female": "Female",
 "q.n.height": "Height (cm)",
 "q.n.weight": "Current weight (kg)",
 "q.n.target": "Target weight (kg)",
 "q.n.waist": "Waist (cm)",
 "q.n.neck": "Neck (cm)",
 "q.n.hip": "Hip (cm)",
 "q.n.diet": "Dietary preference",
 "q.n.diet.ph": "e.g. balanced, vegetarian, keto",
 "q.n.allergies": "Food allergies",
 "q.n.disliked": "Foods you dislike",
 "q.n.meals": "Meals per day",
 "q.n.water": "Water intake (liters/day)",
 "q.n.medical": "Medical conditions",
 "q.n.supplements": "Supplements you take",
 "q.n.notes": "Anything else?",
 "q.n.photos": "Progress photos (optional)",
 "q.n.photos.hint": "Upload front / side / back photos so the coach can assess your physique. Max 3 photos.",
 "q.n.photos.upload": "Upload photo",
 "q.f.goal": "Main fitness goal",
 "q.f.goal.ph": "e.g. lose fat, build muscle",
 "q.f.activity": "Daily activity level",
 "q.f.activity.ph": "Select your daily activity level",
 "q.f.activity.sedentary": "Sedentary (desk job, no exercise)",
 "q.f.activity.light": "Light (1-3 days/week light exercise)",
 "q.f.activity.moderate": "Moderate (3-5 days/week moderate exercise)",
 "q.f.activity.active": "Active (6-7 days/week hard exercise)",
 "q.f.activity.very_active": "Very Active (2x/day, intense training)",
 "q.f.activity.extra_active": "Extra Active (athlete, physical job)",
 "q.f.days": "Training days per week",
 "q.f.location": "Training location",
 "q.f.location.ph": "e.g. gym, home",
 "q.f.experience": "Training experience",
 "q.f.injuries": "Injuries or limitations",
 "q.f.preferred": "Preferred type of training",
 "q.f.equipment": "Available equipment",
 "q.f.sleep": "Average sleep (hours)",
 "q.f.notes": "Anything else?",

 "prog.title": "My Progress",
 "prog.subtitle": "Track your weight, measurements and photos.",
 "prog.addEntry": "Add weekly check-in",
 "prog.newEntry": "New check-in",
 "prog.weight": "Weight (kg)",
 "prog.waist": "Waist (cm)",
 "prog.chest": "Chest (cm)",
 "prog.hips": "Hips (cm)",
 "prog.arm": "Arm (cm)",
 "prog.neck": "Neck (cm)",
 "prog.energy": "Energy level (1-10)",
 "prog.adherence": "Plan adherence (1-10)",
 "prog.notes": "Notes",
 "prog.weightChart": "Weight over time",
 "prog.history": "Check-in history",
 "prog.noEntries": "No check-ins yet. Add your first one!",
 "prog.entrySaved": "Check-in saved",
 "prog.uploadPhoto": "Upload photo",
 "prog.photos": "Progress photos",
 "prog.noPhotos": "No photos yet. Upload your first one!",
 "prog.photoUploaded": "Photo uploaded",

 "plan.print": "Print",
 "plan.calories": "Calories",
 "plan.protein": "Protein",
 "plan.carbs": "Carbs",
 "plan.fat": "Fat",
 "plan.food": "Food",
 "plan.amount": "Amount",
 "plan.sets": "sets",
 "plan.reps": "reps",
 "plan.swap": "Swap",

 "plans.title": "My Plans",
 "plans.subtitle": "Your meal and workout plans from Alkemos.",
 "plans.meal": "Meal plans",
 "plans.workout": "Workout plans",
 "plans.empty": "No plans yet. Your coach will upload them soon.",
 "plans.view": "View plan",
 "plans.openFailed": "Couldn't open the file — please try again.",
 "plans.swaps.mealSwapped": "Meal swapped!",
 "plans.swaps.exerciseSwapped": "Exercise swapped!",
 "plans.swaps.notIncluded": "AI plan generation & swaps are a Premium feature — your current plan doesn't include them yet (monthly quotas that renew with your subscription cycle).",
 "plans.swaps.upgradeCta": "See memberships",

 "support.title": "Support",
 "support.subtitle": "Open a ticket and your coach will get back to you.",
 "support.newTicket": "New ticket",
 "support.subject": "Subject",
 "support.message": "Message",
 "support.create": "Create ticket",
 "support.created": "Ticket created",
 "support.open": "Open",
 "support.pending": "Pending",
 "support.closed": "Closed",
 "support.noTickets": "No tickets yet.",
 "support.reply": "Type your reply…",
 "support.send": "Send reply",

 "coach.title": "Coach Dashboard",
 "coach.subtitle": "Manage your clients and their progress.",
 "coach.support.subtitle": "All client support tickets in one inbox.",
 "admin.title": "Payments",
 "admin.subtitle": "Review subscription requests and payment receipts.",
 "admin.pending": "Pending",
 "admin.approved": "Approved",
 "admin.rejected": "Rejected",
 "admin.all": "All",
 "admin.empty": "No requests found.",
 "admin.approve": "Approve",
 "admin.reject": "Reject",
 "admin.viewReceipt": "View receipt",
 "admin.approvedToast": "Subscription approved and activated!",
 "admin.rejectedToast": "Request rejected.",
 "admin.duration": "months",
 "notif.title": "Notifications",
 "notif.markRead": "Mark all read",
 "notif.empty": "No notifications yet.",
 "coach.totalClients": "Total clients",
 "coach.activeSubs": "Active subscriptions",
 "coach.expiringSoon": "Expiring soon",
 "coach.clients": "Clients",
 "coach.searchClients": "Search clients…",
 "coach.noClients": "No clients yet.",
 "coach.client": "Client",
 "coach.status": "Status",
 "coach.expiry": "Expiry",
 "coach.manage": "Manage",
 "coach.profile": "Profile",
 "coach.subscriptionMgmt": "Subscription",
 // Phase 144 (2026-09-08): parity audit — these keys were USED in
 // CoachClientView/PlansView/ProgressView but MISSING from both dicts,
 // so t() rendered the raw key (the reported "coach.subscription"
 // showing as literal text). Added in both languages below.
 "coach.subscription": "Subscription",
 "coach.deletePlanConfirm": "Delete this plan? This cannot be undone.",
 // 0043: manual date inputs removed — dates are computed from the duration.
 "coach.datesAutoTitle": "Dates (auto-calculated)",
 "coach.datesAutoHint": "The dates are calculated automatically from the selected duration — manual editing is no longer needed.",
 "coach.updateSub": "Update subscription",
 "coach.subUpdated": "Subscription updated",
 "coach.uploadMeal": "Upload meal plan",
 "coach.uploadWorkout": "Upload workout plan",
 "coach.planTitle": "Plan title",
 "coach.planNotes": "Notes (optional)",
 "coach.planFile": "Attach file (PDF, image)",
 "coach.planUploaded": "Plan uploaded",
 "coach.clientProgress": "Client progress",
 "coach.overview": "Overview",
 "coach.backToList": "Back to clients",
 "coach.plansSection": "Plans",
 "coach.aiPlans": "AI Plans",
 "coach.aiHint": "Generate a tailored plan from the client's data using AI.",
 "coach.genWorkout": "Generate workout plan",
 "coach.genNutrition": "Generate nutrition plan",
 "coach.generating": "Generating…",
 "coach.genFailed": "Generation failed",
 "coach.noDrafts": "No AI plans yet. Generate one above.",
 "coach.questionnairesSection": "Questionnaires",
 "coach.noQ": "Not submitted yet.",
 "coach.nutritionQ": "Nutrition questionnaire",
 "coach.fitnessQ": "Fitness questionnaire",

 "pricing.eyebrow": "Membership",
 "pricing.title": "Pricing",
 "pricing.heading": "Choose the coaching level that matches your ambition.",
 "pricing.intro":
 "Every subscription includes a personalized nutrition strategy, custom workout program, continuous progress tracking, and professional coaching to help you achieve your transformation.",
 "pricing.months": "Months",
 "pricing.mostPopular": "MOST POPULAR",
 "pricing.bestExperience": "BEST EXPERIENCE",
 "pricing.everythingIn": "Everything in",
 "pricing.plus": "plus",
 "pricing.egp": "USD",
 "pricing.chooseDuration": "Choose duration",
 "pricing.perMonth": "/mo",
 "pricing.cta": "Get Started",

 "tier.starter": "Starter",
 "tier.starter.sub": "Perfect to begin your transformation journey.",
 "tier.starter.cta": "Get Started",
 "tier.elite": "Elite",
 "tier.elite.sub": "Unlimited access + VIP coaching.",
 "tier.elite.cta": "Go Elite",

 "feat.nutritionPlan": "Personalized nutrition plan",
 "feat.workoutProgram": "Custom workout program",
 "feat.weeklyReview": "Weekly plan review",
 "feat.progressTracking": "Progress tracking & charts",
 "feat.coachSupport": "Direct coach support",
 // §12.50-أ-12 (Phase 193): two dead keys carrying WRONG swap claims
 // (daily quotas contradicting the weekly limits in memberships.ts +
 // the Terms page) were DELETED here to prevent re-use — the limits
 // live in memberships.ts features only. Canaries in
 // marketing-msa-surface.test.ts pin the removal.
 "feat.aiCoach": "Smart AI coach (EVO)",
 "feat.fasterAdjust": "Faster plan adjustments",
 "feat.prioritySupport": "Priority support",
 "feat.vipCoaching": "VIP coaching experience",
 "feat.fastestResponse": "Fastest response time",
 "feat.maxAccountability": "Maximum accountability",

 "rt.weekly": "Weekly",
 "rt.48": "48 hours",
 "rt.24": "24 hours",
 "rt.instant": "Near-instant",

 "cmp.title": "Compare plans",
 "cmp.feature": "Feature",
 "cmp.nutrition": "Nutrition plan",
 "cmp.workout": "Workout program",
 "cmp.progress": "Progress tracking",
 "cmp.responseTime": "Response time",
 "cmp.fasterAdjust": "Faster adjustments",
 "cmp.premiumCoaching": "Premium coaching",
 "cmp.vipPriority": "VIP priority",

 "checkout.title": "Complete your subscription",
 "checkout.plan": "Plan",
 "checkout.duration": "Duration",
 "checkout.total": "Total",
 "checkout.method": "Payment method",
 "checkout.instapay": "InstaPay",
 "checkout.vodafone": "Vodafone Cash",
 "checkout.pay": "I've paid — activate my subscription",
 "checkout.scanQr": "Scan the QR code below with your banking app to pay.",
 "checkout.activated": "Subscription activated! Welcome aboard.",
 "checkout.backToPricing": "Back to pricing",
};

const ar: Dict = {
 "brand.name": "Alkemos",
 "brand.tagline": "منصة لياقة وتغذية أونلاين",
 "nav.dashboard": "لوحة التحكم",
 "nav.coach": "المدرب الذكي",
 "nav.questionnaires": "الاستبيانات",
 "nav.progress": "التقدم",
 "nav.plans": "خطتي",
 "nav.clients": "العملاء",
 "nav.support": "الدعم",
 "nav.support.coach": "صندوق الدعم",
 "nav.admin": "المدفوعات",
 "nav.logout": "تسجيل الخروج",
 "nav.pricing": "الأسعار",
 "nav.referral": "ادعُ أصدقائك",
 "nav.blog": "المدونة",
 "common.save": "حفظ",
 "common.cancel": "إلغاء",
 "common.loading": "جارٍ التحميل…",
 "common.saving": "جارٍ الحفظ…",
 "common.saved": "تم الحفظ بنجاح",
 "common.error": "حدث خطأ ما",
 "common.none": "لا شيء",
 "common.optional": "اختياري",
 "common.back": "رجوع",
 "common.upload": "رفع",
 "common.uploading": "جارٍ الرفع…",
 "common.download": "تحميل",
 "common.delete": "حذف",
 "common.search": "بحث",
 "common.kg": "كجم",
 "common.cm": "سم",
 "common.add": "إضافة",
 "common.view": "عرض",
 "common.notes": "ملاحظات",
 "common.date": "التاريخ",
 "common.title": "العنوان",
 "common.file": "ملف",
 "common.welcome": "أهلًا",
 "common.send": "إرسال",
 "common.open": "فتح",
 "common.close": "إغلاق",


 "auth.login.title": "مرحبًا بعودتك",
 "auth.login.subtitle": "سجّل الدخول إلى لوحة التحكم.",
 "auth.signup.title": "أنشئ حسابك",
 "auth.signup.subtitle": "ابدأ تحوّلك اليوم.",
 "auth.email": "البريد الإلكتروني",
 "auth.password": "كلمة المرور",
 "auth.fullName": "الاسم الكامل",
 "auth.phone": "رقم الهاتف",
 "auth.signIn": "تسجيل الدخول",
 "auth.signUp": "إنشاء حساب",
 "auth.google": "المتابعة عبر Google",
 "auth.or": "أو",
 "auth.googleError": "فشل تسجيل الدخول عبر Google. يرجى المحاولة مرة أخرى أو المتابعة بالبريد الإلكتروني.",
 "auth.haveAccount": "لديك حساب بالفعل؟",
 "auth.noAccount": "ليس لديك حساب؟",
 "auth.toLogin": "تسجيل الدخول",
 "auth.toSignup": "إنشاء حساب",
 "auth.welcomeBack": "تم تسجيل الدخول بنجاح",
 "auth.accountCreated": "تم إنشاء الحساب! أهلًا بك.",
 "auth.demoNotice": "وضع تجريبي — لم يتم إعداد مفاتيح Supabase. بياناتك محفوظة محليًا في هذا المتصفح.",

 "dash.greeting": "مرحبًا بعودتك",
 "dash.subscription": "الاشتراك",
 "dash.active": "نشط",
 "dash.expired": "منتهي",
 "dash.notSet": "غير محدد",
 "dash.daysLeft": "يوم متبقٍ",
 "dash.expiresOn": "ينتهي في",
 "dash.latestWeight": "أحدث وزن",
 "dash.startWeight": "الوزن الابتدائي",
 "dash.change": "التغير",
 "dash.noWeight": "لم يتم تسجيل وزن بعد",
 "dash.quickActions": "إجراءات سريعة",
 "dash.logProgress": "تسجيل التقدم",
 "dash.viewPlans": "عرض خططي",
 "dash.fillQuestionnaires": "أكمل الاستبيانات",
 "dash.renewNow": "جدّد الآن",
 "dash.renew": "تجديد",
 "dash.openQuestionnaires": "فتح الاستبيانات",
 "dash.startHere": "ابدأ من هنا",
 "dash.startSub": "ثلاث خطوات تفصلك عن خطتك",
 "dash.step1": "أكمل استبيان التغذية واللياقة",
 "dash.step2": "سجّل وزنك الحالي",
 "dash.step3": "خطتك تظهر هنا فور جاهزيتها",
 "dash.startCta": "ابدأ بالاستبيان",
 "dash.errorLoad": "تعذر تحميل لوحتك. تحقق من اتصالك ثم أعد المحاولة.",
 "dash.retry": "إعادة المحاولة",
 "dash.logWeightToday": "سجّل وزن اليوم",
 "dash.mealPlans": "خطط الوجبات",
 "dash.workoutPlans": "خطط التمارين",
 "dash.checkins": "المراجعات",
 "dash.statsOverview": "تحوّلك في لمحة",

 "q.title": "الاستبيانات",
 "q.subtitle": "ساعد مدربك في بناء الخطة المثالية لك.",
 "q.nutrition": "التغذية",
 "q.fitness": "اللياقة",
 "q.saved": "تم حفظ الاستبيان",
 "q.submit": "إرسال للمراجعة",
 "q.submitted": "تم إرسال الاستبيان! سيراجعه المدرب.",
 "q.status.draft": "مسودة",
 "q.status.submitted": "مُرسل",
 "q.status.approved": "معتمد",
 "q.status.needs_info": "يحتاج معلومات",
 "q.lockedNotice": "استبيانك مغلق أثناء مراجعة المدرب له.",
 "q.needsInfoNotice": "طلب مدربك معلومات إضافية. يرجى التحديث وإعادة الإرسال.",
 "q.step1": "التغذية",
 "q.step2": "اللياقة",
 "q.step1.desc": "أخبرنا عن عاداتك الغذائية وأهدافك.",
 "q.step2.desc": "أخبرنا عن تدريبك ونمط حياتك.",
 "q.step": "خطوة",
 "q.of": "من",
 "q.next": "التالي: استبيان اللياقة",
 "q.back": "رجوع",
 "q.saveDraft": "حفظ مسودة",
 "q.submitAll": "إرسال الاستبيانين",
 "q.nutritionSaved": "تم حفظ استبيان التغذية! فلنكمل باستبيان اللياقة.",
 "q.allSubmitted": "تم إرسال الاستبيانين! سيراجعهما المدرب.",
 "q.reviewTitle": "مراجعة قبل الإرسال",
 "q.reviewDesc": "تأكد من صحة كل البيانات قبل إرسالها إلى المدرب.",
 "q.required": "إجباري",
 "q.optional": "اختياري",
 "q.fillRequired": "يرجى ملء كل الحقول الإجبارية",
 "q.fillGender": "يرجى تحديد الجنس",
 "q.fillBasicInfo": "يرجى ملء: الجنس، العمر، الطول، الوزن، والوزن المستهدف",
 "q.fillFitnessBasic": "يرجى ملء: الهدف، مستوى النشاط، وأيام التدريب",
 "q.n.age": "العمر",
 "q.n.gender": "الجنس",
 "q.n.gender.male": "ذكر",
 "q.n.gender.female": "أنثى",
 "q.n.height": "الطول (سم)",
 "q.n.weight": "الوزن الحالي (كجم)",
 "q.n.target": "الوزن المستهدف (كجم)",
 "q.n.waist": "محيط الخصر (سم)",
 "q.n.neck": "محيط الرقبة (سم)",
 "q.n.hip": "محيط الورك (سم)",
 "q.n.diet": "النظام الغذائي المفضل",
 "q.n.diet.ph": "مثلًا: متوازن، نباتي، كيتو",
 "q.n.allergies": "حساسية الطعام",
 "q.n.disliked": "أطعمة لا تحبها",
 "q.n.meals": "وجبات في اليوم",
 "q.n.water": "شرب الماء (لتر/يوم)",
 "q.n.medical": "حالات طبية",
 "q.n.supplements": "مكملات تتناولها",
 "q.n.notes": "أي شيء آخر؟",
 "q.n.photos": "صور تقدم (اختياري)",
 "q.n.photos.hint": "ارفع صورًا أمامية وجانبية وخلفية ليتمكن المدرب من تقييم جسمك — بحد أقصى 3 صور.",
 "q.n.photos.upload": "رفع صورة",
 "q.f.goal": "الهدف الرياضي الرئيسي",
 "q.f.goal.ph": "مثلًا: خسارة دهون، بناء عضلات",
 "q.f.activity": "مستوى النشاط اليومي",
 "q.f.activity.ph": "اختر مستوى نشاطك اليومي",
 "q.f.activity.sedentary": "خامل (عمل مكتبي، بلا رياضة)",
 "q.f.activity.light": "خفيف (1-3 أيام/أسبوع رياضة خفيفة)",
 "q.f.activity.moderate": "متوسط (3-5 أيام/أسبوع رياضة متوسطة)",
 "q.f.activity.active": "نشط (6-7 أيام/أسبوع رياضة قوية)",
 "q.f.activity.very_active": "نشط جدًا (مرتين/يوم، تدريب مكثف)",
 "q.f.activity.extra_active": "نشط فوق العادي (رياضي محترف، عمل بدني)",
 "q.f.days": "أيام التدريب في الأسبوع",
 "q.f.location": "مكان التدريب",
 "q.f.location.ph": "مثلًا: نادٍ رياضي، المنزل",
 "q.f.experience": "خبرة التدريب",
 "q.f.injuries": "إصابات أو قيود",
 "q.f.preferred": "نوع التدريب المفضل",
 "q.f.equipment": "المعدات المتاحة",
 "q.f.sleep": "متوسط النوم (ساعات)",
 "q.f.notes": "أي شيء آخر؟",

 "prog.title": "تقدمي",
 "prog.subtitle": "تتبع وزنك وقياساتك وصورك.",
 "prog.addEntry": "إضافة مراجعة أسبوعية",
 "prog.newEntry": "مراجعة جديدة",
 "prog.weight": "الوزن (كجم)",
 "prog.waist": "الخصر (سم)",
 "prog.chest": "الصدر (سم)",
 "prog.hips": "الأرداف (سم)",
 "prog.arm": "الذراع (سم)",
 "prog.neck": "الرقبة (سم)",
 "prog.energy": "مستوى الطاقة (1-10)",
 "prog.adherence": "الالتزام بالخطة (1-10)",
 "prog.notes": "ملاحظات",
 "prog.weightChart": "الوزن عبر الزمن",
 "prog.history": "سجل المراجعات",
 "prog.noEntries": "لا توجد مراجعات بعد. أضف أول واحدة!",
 "prog.entrySaved": "تم حفظ المراجعة",
 "prog.uploadPhoto": "رفع صورة",
 "prog.photos": "صور التقدم",
 "prog.noPhotos": "لا توجد صور بعد. ارفع أول صورة!",
 "prog.photoUploaded": "تم رفع الصورة",

 "plan.print": "طباعة",
 "plan.calories": "السعرات",
 "plan.protein": "البروتين",
 "plan.carbs": "الكربوهيدرات",
 "plan.fat": "الدهون",
 "plan.food": "الطعام",
 "plan.amount": "الكمية",
 "plan.sets": "مجموعات",
 "plan.reps": "تكرارات",
 "plan.swap": "استبدال",

 "plans.title": "خطتي",
 "plans.subtitle": "خطط وجباتك وتمارينك من فريق Alkemos.",
 "plans.meal": "خطط الوجبات",
 "plans.workout": "خطط التمارين",
 "plans.empty": "لا توجد خطط بعد. سيرفعها المدرب قريبًا.",
 "plans.view": "عرض الخطة",
 "plans.openFailed": "تعذر فتح الملف — حاول مرة أخرى.",
 "plans.swaps.mealSwapped": "تم استبدال الوجبة!",
 "plans.swaps.exerciseSwapped": "تم استبدال التمرين!",
 "plans.swaps.notIncluded": "توليد الخطط والتبديلات بالذكاء الاصطناعي ميزة في باقة بريميوم — بحصص شهرية تتجدد مع دورة الاشتراك، وباقتك الحالية لا تشملها بعد.",
 "plans.swaps.upgradeCta": "استعرض العضويات",

 // EVO CHAT SURFACE LAW (2026-08-27): chat.* keys retired with the
 // /chat page — the floating widget is the only chat surface.

 "support.title": "الدعم",
 "support.subtitle": "افتح تذكرة وسيرد عليك المدرب.",
 "support.newTicket": "تذكرة جديدة",
 "support.subject": "الموضوع",
 "support.message": "الرسالة",
 "support.create": "إنشاء التذكرة",
 "support.created": "تم إنشاء التذكرة",
 "support.open": "مفتوحة",
 "support.pending": "قيد الانتظار",
 "support.closed": "مغلقة",
 "support.noTickets": "لا توجد تذاكر بعد.",
 "support.reply": "اكتب ردك…",
 "support.send": "إرسال الرد",

 "coach.title": "لوحة تحكم المدرب",
 "coach.subtitle": "أدر عملائك وتقدمهم.",
 "coach.support.subtitle": "كل تذاكر العملاء في صندوق واحد.",
 "admin.title": "المدفوعات",
 "admin.subtitle": "راجع طلبات الاشتراك وإيصالات الدفع.",
 "admin.pending": "قيد الانتظار",
 "admin.approved": "موافق عليها",
 "admin.rejected": "مرفوضة",
 "admin.all": "الكل",
 "admin.empty": "لا توجد طلبات.",
 "admin.approve": "موافقة",
 "admin.reject": "رفض",
 "admin.viewReceipt": "عرض الإيصال",
 "admin.approvedToast": "تمت الموافقة على الاشتراك وتفعيله!",
 "admin.rejectedToast": "تم رفض الطلب.",
 "admin.duration": "أشهر",
 "notif.title": "الإشعارات",
 "notif.markRead": "تعليم الكل كمقروء",
 "notif.empty": "لا توجد إشعارات بعد.",
 "coach.totalClients": "إجمالي العملاء",
 "coach.activeSubs": "اشتراكات نشطة",
 "coach.expiringSoon": "تنتهي قريبًا",
 "coach.clients": "العملاء",
 "coach.searchClients": "ابحث عن عملاء…",
 "coach.noClients": "لا يوجد عملاء بعد.",
 "coach.client": "العميل",
 "coach.status": "الحالة",
 "coach.expiry": "الانتهاء",
 "coach.manage": "إدارة",
 "coach.profile": "الملف الشخصي",
 "coach.subscriptionMgmt": "الاشتراك",
 // Phase 144: مفاتيح كانت مستخدمة في الكود وغير موجودة في القاموسين —
 // كانت بتظهر خام (مثل coach.subscription في كارت اشتراك العميل).
 "coach.subscription": "الاشتراك",
 "coach.deletePlanConfirm": "هل تريد حذف هذه الخطة؟ لا يمكن التراجع.",
 // 0043: خانات التاريخ اليدوية اتشالت — التواريخ بتتحسب من المدة المختارة.
 "coach.datesAutoTitle": "التواريخ (تُحسب تلقائيًا)",
 "coach.datesAutoHint": "لا حاجة لإدخال التواريخ يدويًا — اختر المدة، ويحسب الموقع تاريخي البداية والنهاية تلقائيًا، ويضيف المدة إلى المتبقي إذا كان للعميل اشتراك نشط من النوع نفسه.",
 "coach.updateSub": "تحديث الاشتراك",
 "coach.subUpdated": "تم تحديث الاشتراك",
 "coach.uploadMeal": "رفع خطة وجبات",
 "coach.uploadWorkout": "رفع خطة تمارين",
 "coach.planTitle": "عنوان الخطة",
 "coach.planNotes": "ملاحظات (اختياري)",
 "coach.planFile": "إرفاق ملف (PDF، صورة)",
 "coach.planUploaded": "تم رفع الخطة",
 "coach.clientProgress": "تقدم العميل",
 "coach.overview": "نظرة عامة",
 "coach.backToList": "العودة للعملاء",
 "coach.plansSection": "الخطط",
 "coach.aiPlans": "خطط الذكاء الاصطناعي",
 "coach.aiHint": "ولّد خطة مخصصة من بيانات العميل باستخدام الذكاء الاصطناعي.",
 "coach.genWorkout": "توليد برنامج تمارين",
 "coach.genNutrition": "توليد خطة تغذية",
 "coach.generating": "جارٍ التوليد…",
 "coach.genFailed": "فشل التوليد",
 "coach.noDrafts": "لا توجد خطط بعد. ولّد واحدة من الأعلى.",
 "coach.questionnairesSection": "الاستبيانات",
 "coach.noQ": "لم يُرسل بعد.",
 "coach.nutritionQ": "استبيان التغذية",
 "coach.fitnessQ": "استبيان اللياقة",

 "pricing.eyebrow": "العضوية",
 "pricing.title": "الأسعار",
 "pricing.heading": "اختر مستوى التدريب الذي يطابق طموحك.",
 "pricing.intro":
 "كل اشتراك يتضمن استراتيجية تغذية مخصصة، برنامج تمارين مخصص، تتبع مستمر للتقدم، وتدريبًا احترافيًا لمساعدتك في تحقيق تحوّلك.",
 "pricing.months": "أشهر",
 "pricing.mostPopular": "الأكثر شيوعًا",
 "pricing.bestExperience": "أفضل تجربة",
 "pricing.everythingIn": "كل ما في",
 "pricing.plus": "زائد",
 "pricing.egp": "دولار",
 "pricing.chooseDuration": "اختر المدة",
 "pricing.perMonth": "/شهر",
 "pricing.cta": "ابدأ الآن",

 "tier.starter": "ستارتر",
 "tier.starter.sub": "مثالي لبدء رحلة التحول.",
 "tier.starter.cta": "ابدأ الآن",
 "tier.elite": "إيليت",
 "tier.elite.sub": "وصول غير محدود + تدريب VIP.",
 "tier.elite.cta": "اشترك في إيليت",

 "feat.nutritionPlan": "خطة تغذية مخصصة",
 "feat.workoutProgram": "برنامج تمارين مخصص",
 "feat.weeklyReview": "مراجعة أسبوعية للخطة",
 "feat.progressTracking": "تتبع التقدم والرسوم البيانية",
 "feat.coachSupport": "دعم مباشر من المدرب",
 // §12.50-أ-12 (Phase 193): حذف مفتاحين ميتين كانا يحملان ادعاءات تبديل
 // خاطئة (يومية بدل الأسبوعية الفعلية في memberships.ts وصفحة الشروط).
 "feat.aiCoach": "المدرب الذكي (EVO)",
 "feat.fasterAdjust": "تعديلات أسرع للخطة",
 "feat.prioritySupport": "دعم بأولوية",
 "feat.vipCoaching": "تجربة تدريب VIP",
 "feat.fastestResponse": "أسرع زمن استجابة",
 "feat.maxAccountability": "أقصى درجات المساءلة",

 "rt.weekly": "أسبوعي",
 "rt.48": "48 ساعة",
 "rt.24": "24 ساعة",
 "rt.instant": "شبه فوري",

 "cmp.title": "قارن الخطط",
 "cmp.feature": "الميزة",
 "cmp.nutrition": "خطة التغذية",
 "cmp.workout": "برنامج التمارين",
 "cmp.progress": "تتبع التقدم",
 "cmp.responseTime": "زمن الاستجابة",
 "cmp.fasterAdjust": "تعديلات أسرع",
 "cmp.premiumCoaching": "تدريب متميز",
 "cmp.vipPriority": "أولوية VIP",

 "checkout.title": "أكمل اشتراكك",
 "checkout.plan": "الخطة",
 "checkout.duration": "المدة",
 "checkout.total": "الإجمالي",
 "checkout.method": "طريقة الدفع",
 "checkout.instapay": "إنستا باي",
 "checkout.vodafone": "فودافون كاش",
 "checkout.pay": "دفعت — فعّل اشتراكي",
 "checkout.scanQr": "امسح رمز QR أدناه بتطبيق بنكك للدفع.",
 "checkout.activated": "تم تفعيل الاشتراك! أهلًا بك.",
 "checkout.backToPricing": "العودة للأسعار",
};

const dicts: Record<Lang, Dict> = { en, ar };

// Exported for the W1-4a render-storm canary (the probe types the ctx
// object) — type-only, zero runtime surface.
export type I18nCtx = {
 lang: Lang;
 setLang: (l: Lang) => void;
 t: (key: string) => string;
 dir: "rtl" | "ltr";
};

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({
 children,
 urlLocale,
}: {
 children: ReactNode;
 /**
  * Server-resolved locale passed from the root layout
  * (`resolveLocale()` in `src/app/layout.tsx`), derived from the
  * `x-pathname` header. Used as the INITIAL state so the server-rendered
  * HTML matches the URL: `/ar/*` server-renders Arabic strings (SEO +
  * no flash). Client-side effects below then refine per URL/pref.
  */
 urlLocale?: Lang;
}) {
 // Initial language: server-resolved URL locale → default "en".
 const [lang, setLangState] = useState<Lang>(urlLocale ?? "en");

 // Current-URL logic lives in the UrlLocaleSync LEAF below (W1-4a ·
 // audit P-01) — the provider itself no longer subscribes to pathname.

 useEffect(() => {
   // F-2 Option A (AR-DISCOVERY-UI-SETTLE-AUDIT-2026-11-07 §6 — owner
   // decision 2026-11-07): `<html lang dir>` come from the per-group
   // root layouts ((en) → en/ltr STATIC · (ar) → ar/rtl STATIC · (app)
   // → the preference cookie via its DYNAMIC layout — 449, see
   // src/lib/surface-locale.ts), so the first server HTML and first
   // paint already match. This effect mutates `document.documentElement`
   // only when `lang` legitimately changes client-side, which happens
   // ONLY through:
   //   1. an SPA navigation across a surface-class boundary —
   //      UrlLocaleSync below re-resolves the new path (the M31 mirror
   //      toggle / ↔ /ar, any cross-locale link, entering/leaving the
   //      account surfaces);
   //   2. the in-page LanguageToggle on mirror-less private surfaces
   //      (/auth, /checkout, /admin, /profile…) — a chrome swap with no
   //      URL change. 449: the swap is now PERSISTENT — the choice
   //      lands in the mhe:lang cookie + localStorage and the sync's
   //      special-surface branch re-resolves the SAME preference on
   //      every subsequent navigation (pre-449 it reverted to "en" on
   //      the next click — the admin-panel bug, report §11).
   // The legacy post-hydration flip driven by `localStorage["mhe:lang"]`
   // on PUBLIC non-/ar URLs (audit R-1) stays GONE — public pages never
   // read the preference (F-2-A verbatim; pinned by canaries).
   // The `suppressHydrationWarning` on `<html>` in `RootShell` covers
   // case 2 + the special-surface SSR/preference convergence: a client
   // state that intentionally diverges from the server attributes
   // later in the session.
   const dir = lang === "ar" ? "rtl" : "ltr";
   document.documentElement.lang = lang;
   document.documentElement.dir = dir;
 }, [lang]);

 const setLang = useCallback((l: Lang) => {
 setLangState(l);
 // 449 SURFACE LOCALE LAW (src/lib/surface-locale.ts — report §11):
 // mirror the explicit choice into the mhe:lang COOKIE so the (app)
 // group's dynamic root layout can server-render the right lang/dir
 // from the FIRST HTML (localStorage is invisible to SSR — the exact
 // reason the pre-449 admin panel could never reload in Arabic).
 // 450: persistLangChoice writes BOTH stores in one step (cookie via
 // document.cookie ONLY — no server Set-Cookie anywhere — plus the
 // legacy localStorage key), so the two can never drift apart.
 persistLangChoice(l);
 }, []);

 const t = useCallback(
 (key: string) => dicts[lang][key] ?? dicts.en[key] ?? key,
 [lang],
 );

 // W1-4a (audit P-01 — 2026-10-02): the ctx value is MEMOIZED — its
 // reference changes ONLY when `lang` changes (setLang/t are
 // useCallback-stable). An SPA navigation used to re-render the provider
 // (pathname subscription) and hand every useI18n consumer a fresh object
 // identity even though the language never changed — the audit's render
 // storm on every route change.
 const value = useMemo<I18nCtx>(
   () => ({ lang, setLang, t, dir: lang === "ar" ? "rtl" : "ltr" }),
   [lang, setLang, t],
 );

 return (
 <Ctx.Provider value={value}>
 {/* W1-4a (audit P-01): the pathname subscription lives in this
     null-rendering LEAF — a route change re-renders only the leaf
     while the memoized value keeps every useI18n consumer
     untouched. The URL-first resolution moved here VERBATIM. */}
 <UrlLocaleSync setLangState={setLangState} />
 {children}
 </Ctx.Provider>
 );
}

/* ── W1-4a (audit P-01 — 2026-10-02): pathname subscription torn off ────
 *
 * 450 UNIFIED CHOICE LAW (owner order 2026-11-08 — governing report
 * §12: docs/AR-DISCOVERY-UI-SETTLE-AUDIT-2026-11-07.md). The 449 law
 * this leaf enforced had TWO governors (the URL for the public trees,
 * the persisted preference for the special surfaces) — and the bridges
 * between them (the logo → "/", use-nav view paths, any latent EN
 * link) changed the language for a choice-holding user on every
 * boundary crossing, exactly the "تغيير اللغة دون اختيار المستخدم"
 * the owner's order outlaws. The 450 law this leaf now enforces has
 * ONE governor — the RECORDED CHOICE — and this leaf keeps the URL in
 * sync with it on public surfaces:
 *
 *   1. SPECIAL surfaces → the PERSISTED CHOICE (449 verbatim: the URL
 *      carries no language dimension there; the toggle is the change
 *      mechanism; the (app) layout already SSR'd the same value from
 *      the mhe:lang cookie — steady state this is a no-op setState).
 *      A legacy localStorage-only choice gets its cookie backfilled
 *      here, and a DIVERGENT pair (cookie≠localStorage) is healed to
 *      the cookie's value — the store the server governors read (the
 *      450 cookie-first priority: a client that resolved a different
 *      store than the middleware would bounce forever).
 *   2. PUBLIC + a recorded choice → the RENDER language still follows
 *      the URL (F-2-A: no mixed chrome — an EN-only article page
 *      renders fully EN), but a URL in the WRONG tree is replaced to
 *      its structural mirror (mirrorPath — the central map shared
 *      with the toggle and use-nav). This is the client safety net
 *      for the paths the central view resolver cannot reach (a
 *      Cloudflare edge-cache HIT serves cached HTML without touching
 *      the origin, external links/bookmarks, latent stray links). In
 *      steady navigation it NEVER fires: in-tree links keep the tree
 *      and use-nav lands view navigations in the chosen tree directly.
 *   3. PUBLIC + no recorded choice → the 447/F-2-A law VERBATIM: the
 *      URL governs (crawlers and first-time visitors are
 *      byte-identical), with ONE addition — a first visit to the
 *      Arabic tree passively records the browsing language (ar) as
 *      the choice, so the visitor→auth boundary never flips a
 *      first-time Arabic reader to an English login. English needs no
 *      passive record: it is the documented default when no choice
 *      exists, and recording it would bounce first-time EN visitors
 *      off the /ar links they deliberately follow.
 *
 * The saved choice is WRITTEN by setLang (the toggle — both stores)
 * and read cookie-first (readStoredLang). Living in this
 * null-rendering leaf, the per-route re-render stays INSIDE this
 * component instead of re-rendering the provider + every useI18n
 * consumer in the app (setLangState arrives as a stable setState
 * reference). */
function UrlLocaleSync({
 setLangState,
}: {
 setLangState: Dispatch<SetStateAction<Lang>>;
}) {
 const pathname = usePathname() || "/";
 const router = useRouter();

 useEffect(() => {
   const stored = readStoredLang(); // cookie-first (null = fresh visitor)

   if (isSpecialSurface(pathname)) {
     // Class 1: mirror-less private surface — the URL carries NO
     // language dimension, so the RECORDED CHOICE governs the chrome
     // (pre-449 the leaf forced "en" here and the toggle's swap died
     // on the next navigation — the admin-panel bug). Steady state
     // this equals the (app) layout's SSR value (a no-op setState);
     // a legacy localStorage-only choice converges via the heal, and
     // a divergent pair heals to the cookie's value. A fresh visitor
     // (stored=null) records nothing — English is the documented
     // default, and 450 adds no cookie noise for it.
     const pref = stored ?? "en";
     setLangState(pref);
     if (stored !== null) healLangStores(pref);
     return;
   }

   // PUBLIC surface — the URL's tree decides the RENDER language…
   const urlLang: Lang = isArabicPath(pathname) ? "ar" : "en";

   if (stored === null) {
     // Class 3 — fresh visitor: F-2-A verbatim (the URL governs), plus
     // the passive record of a FIRST Arabic-tree visit so the
     // visitor→special-surface boundary keeps the reader's language.
     if (urlLang === "ar") persistLangChoice("ar");
     setLangState(urlLang);
     return;
   }

   // Converge the stores to the resolved choice (write-free in
   // steady state): a legacy localStorage-only choice gets its
   // cookie backfilled here so the NEXT SSR/middleware read is
   // correct, and a half-synced pair heals to the cookie's value.
   healLangStores(stored);

   // …but a choice-holder never STAYS in the wrong tree: replace to
   // the structural mirror (replace, not push — no history entry for
   // the wrong-tree URL; the back button returns to the content in
   // the user's chosen language). No mirror (single-language content,
   // e.g. an EN-only blog article): serve the URL's language — the
   // page renders fully in it, no mixed chrome, no 404 bounce.
   if (stored !== urlLang) {
     const mirror = mirrorPath(pathname, stored);
     if (mirror) {
       const qs =
         typeof window !== "undefined" && window.location.search
           ? window.location.search
           : "";
       router.replace(qs && !mirror.includes("?") ? `${mirror}${qs}` : mirror);
       return;
     }
   }
   setLangState(urlLang);
 }, [pathname, router, setLangState]);

 return null;
}

export function useI18n() {
 const ctx = useContext(Ctx);
 if (!ctx) throw new Error("useI18n must be used within I18nProvider");
 return ctx;
}
