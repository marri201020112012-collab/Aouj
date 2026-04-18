// ─────────────────────────────────────────────────────────────────────────────
// AOUJ  ·  Bilingual Dictionary  ·  English + Arabic (MSA / Saudi financial)
// All Arabic reviewed for financial-register accuracy, not machine-translated.
// ─────────────────────────────────────────────────────────────────────────────

export type Lang = "en" | "ar";

const dict = {
  // ── Navigation ────────────────────────────────────────────────────────────
  "nav.brand":        { en: "AOUJ",                     ar: "أوج" },
  "nav.subtitle":     { en: "Property Valuation",       ar: "تقييم عقاري" },
  "nav.home":         { en: "Home",                     ar: "الرئيسية" },
  "nav.screen":       { en: "Screen",                   ar: "فرز" },
  "nav.valuation":    { en: "Valuation",                ar: "التقييم" },
  "nav.cases":        { en: "Cases",                    ar: "الملفات" },
  "nav.source":       { en: "Source",                   ar: "مصادر" },
  "nav.market":       { en: "Market",                   ar: "السوق" },
  "nav.langToggle":   { en: "عربي",                     ar: "EN" },

  // ── Hero ──────────────────────────────────────────────────────────────────
  "hero.badge":       { en: "Dual-Approach Valuation Engine · Q1 2026",
                        ar: "محرك التقييم الثنائي المدخل · الربع الأول 2026" },
  "hero.title":       { en: "AOUJ",                     ar: "أوج" },
  "hero.subtitle":    { en: "Directional Property Valuation",
                        ar: "تقييم عقاري توجيهي" },
  "hero.desc":        { en: "Sales comparison + income approach reconciliation with financing analysis, cap rate sensitivity, and TAQEEM compliance signals.",
                        ar: "تحليل يجمع بين مدخل مقارنة المبيعات ومدخل الدخل، مع تحليل التمويل وحساسية معدل الرسملة وإشارات الامتثال لمعايير هيئة التقييم (تقييم)." },
  "hero.stat1":       { en: "7 Cities",                 ar: "٧ مدن" },
  "hero.stat1sub":    { en: "covered",                  ar: "مشمولة" },
  "hero.stat2":       { en: "40+ Districts",             ar: "+٤٠ حياً" },
  "hero.stat2sub":    { en: "calibrated",               ar: "مُعايَرة" },
  "hero.stat3":       { en: "TAQEEM",                   ar: "تقييم" },
  "hero.stat3sub":    { en: "aligned",                  ar: "متوافق" },
  "hero.stat4":       { en: "SAMA",                     ar: "ساما" },
  "hero.stat4sub":    { en: "referenced",               ar: "مرجعي" },
  "hero.scenarios":   { en: "Quick Scenarios",           ar: "سيناريوهات سريعة" },

  // ── Scenarios ─────────────────────────────────────────────────────────────
  "scenario.0.label":       { en: "Riyadh Villa",         ar: "فيلا — الرياض" },
  "scenario.0.description": { en: "Al Olaya · 350 sqm",   ar: "العليا · 350 م²" },
  "scenario.1.label":       { en: "Jeddah Apartment",     ar: "شقة — جدة" },
  "scenario.1.description": { en: "Al Shati · 120 sqm",   ar: "الشاطئ · 120 م²" },
  "scenario.2.label":       { en: "Dammam Commercial",    ar: "تجاري — الدمام" },
  "scenario.2.description": { en: "Al Faisaliyah · 200 sqm", ar: "الفيصلية · 200 م²" },

  // ── Property Form ─────────────────────────────────────────────────────────
  "form.title":         { en: "Property Details",          ar: "تفاصيل العقار" },
  "form.city":          { en: "City / Region",             ar: "المدينة / المنطقة" },
  "form.district":      { en: "District",                  ar: "الحي" },
  "form.propertyType":  { en: "Property Type",             ar: "نوع العقار" },
  "form.size":          { en: "Size (sqm)",                ar: "المساحة (م²)" },
  "form.condition":     { en: "Condition",                 ar: "حالة العقار" },
  "form.txType":        { en: "Transaction Type",          ar: "نوع المعاملة" },
  "form.yearBuilt":     { en: "Year Built (optional)",     ar: "سنة البناء (اختياري)" },
  "form.floorLevel":    { en: "Floor Level (optional)",    ar: "الطابق (اختياري)" },
  "form.frontage":      { en: "Street Frontage / Corner Plot", ar: "واجهة شارع / قطعة زاوية" },
  "form.frontageDesc":  { en: "Corner / street-facing plot (+25%)", ar: "قطعة زاوية أو ذات واجهة شارع (+25%)" },
  "form.generate":      { en: "Generate Analysis",         ar: "توليد التحليل" },
  "form.sizePlaceholder":    { en: "e.g. 300",             ar: "مثلاً 300" },
  "form.yearPlaceholder":    { en: "e.g. 2010",            ar: "مثلاً 2010" },
  "form.floorPlaceholder":   { en: "e.g. 8",               ar: "مثلاً 8" },
  "form.sizeError":     { en: "Please enter a valid size (sqm > 0)", ar: "يرجى إدخال مساحة صحيحة (أكبر من صفر)" },

  // ── Result — Headline ─────────────────────────────────────────────────────
  "result.reconciledTitle":  { en: "Reconciled Valuation",        ar: "القيمة المُرجَّحة" },
  "result.rentTitle":        { en: "Annual Rent Estimate",        ar: "تقدير الإيجار السنوي" },
  "result.saveCase":         { en: "Save as Case",                ar: "حفظ كملف" },
  "result.rangeLabel":       { en: "Estimated Range (SAR)",       ar: "النطاق التقديري (ريال سعودي)" },
  "result.rentLabel":        { en: "Estimated Annual Rent (SAR/yr)", ar: "تقدير الإيجار السنوي (ريال/سنة)" },
  "result.midpoint":         { en: "Midpoint",                   ar: "القيمة الوسطى" },
  "result.perSqm":           { en: "SAR {v}/sqm",                ar: "{v} ريال/م²" },
  "result.salesCompLabel":   { en: "Sales Comparison ({w}% weight)", ar: "مقارنة المبيعات ({w}% وزن)" },
  "result.incomeLabel":      { en: "Income Approach ({w}% weight)",  ar: "مدخل الدخل ({w}% وزن)" },
  "result.depreciation":     { en: "Depreciation",               ar: "الإهلاك" },
  "result.buildUp":          { en: "Valuation Build-Up",         ar: "مكونات التقييم" },
  "result.conf.High":        { en: "High Confidence",            ar: "موثوقية عالية" },
  "result.conf.Medium":      { en: "Medium Confidence",          ar: "موثوقية متوسطة" },
  "result.conf.Low":         { en: "Low Confidence",             ar: "موثوقية منخفضة" },

  // ── Income Approach ───────────────────────────────────────────────────────
  "income.title":       { en: "Income Approach — NOI Analysis",
                          ar: "مدخل الدخل — تحليل صافي الدخل التشغيلي" },
  "income.gri":         { en: "Gross Rental Income",            ar: "إجمالي دخل الإيجار" },
  "income.vacancy":     { en: "Vacancy Allowance ({v}% — {src})", ar: "خصم الشغور ({v}% — {src})" },
  "income.egi":         { en: "Effective Gross Income",         ar: "إجمالي الدخل الفعلي" },
  "income.opex":        { en: "Operating Expenses ({v}% of EGI)", ar: "المصاريف التشغيلية ({v}% من إجمالي الدخل الفعلي)" },
  "income.noi":         { en: "Net Operating Income (NOI)",     ar: "صافي الدخل التشغيلي (NOI)" },
  "income.capRate":     { en: "Market Cap Rate — {src}",        ar: "معدل الرسملة السوقي — {src}" },
  "income.value":       { en: "Income Approach Value",          ar: "قيمة مدخل الدخل" },
  "income.yield":       { en: "Implied Gross Yield (GRI ÷ Sales Comp)", ar: "العائد الإجمالي الضمني (إجمالي الإيجار ÷ مقارنة المبيعات)" },
  "income.perYr":       { en: "/yr",                            ar: "/سنة" },

  // ── Sensitivity ───────────────────────────────────────────────────────────
  "sens.capTitle":      { en: "Cap Rate Sensitivity",           ar: "حساسية معدل الرسملة" },
  "sens.mktTitle":      { en: "Market Price Sensitivity",       ar: "حساسية سعر السوق" },
  "sens.capNote":       { en: "Impact on income approach value from cap rate movements (NOI held constant).",
                          ar: "تأثير تحركات معدل الرسملة على قيمة مدخل الدخل (مع ثبات صافي الدخل التشغيلي)." },
  "sens.mktNote":       { en: "Impact on reconciled value from market price movements (bull / base / bear).",
                          ar: "تأثير تحركات أسعار السوق على القيمة المُرجَّحة (صاعد / أساسي / هابط)." },
  "sens.scenario":      { en: "Scenario",                       ar: "السيناريو" },
  "sens.capRate":       { en: "Cap Rate",                       ar: "معدل الرسملة" },
  "sens.shift":         { en: "Shift",                          ar: "التحول" },
  "sens.value":         { en: "Value",                          ar: "القيمة" },
  "sens.delta":         { en: "Δ vs Base",                      ar: "التغير عن الأساس" },

  // ── Financing ─────────────────────────────────────────────────────────────
  "fin.title":          { en: "Financing & Risk Analysis",      ar: "تحليل التمويل والمخاطر" },
  "fin.rentNote":       { en: "LTV analysis based on implied capital value of the income stream. For rent mandates, financing is assessed against the underlying asset value.",
                          ar: "يستند تحليل نسبة القرض إلى القيمة المضمّنة لتدفق الدخل. يُقيَّم التمويل في مقابل قيمة الأصل الأساسي لتفويضات الإيجار." },
  "fin.samaLtv":        { en: "SAMA Max LTV",                   ar: "الحد الأقصى لنسبة القرض إلى القيمة (ساما)" },
  "fin.maxLoan":        { en: "Implied Max Loan",               ar: "الحد الأقصى المُقدَّر للقرض" },
  "fin.lendingRate":    { en: "Lending Rate (proxy)",           ar: "معدل الإقراض (مرجعي)" },
  "fin.debtService":    { en: "Annual Debt Service (20yr)",     ar: "خدمة الدين السنوية (20 سنة)" },
  "fin.fsv":            { en: "Forced Sale Value ({v}% haircut)", ar: "قيمة البيع الاضطراري (خصم {v}%)" },
  "fin.fsvPct":         { en: "FSV as % of Market Value",       ar: "نسبة قيمة البيع الاضطراري إلى القيمة السوقية" },
  "fin.dscr":           { en: "DSCR",                           ar: "نسبة تغطية خدمة الدين" },
  "fin.dscrMin":        { en: "(min 1.25x)",                    ar: "(الحد الأدنى 1.25×)" },
  "fin.perYr":          { en: "/yr",                            ar: "/سنة" },

  // ── Market Context ────────────────────────────────────────────────────────
  "mkt.title":          { en: "Market Context",                 ar: "السياق السوقي" },
  "mkt.samaRate":       { en: "SAMA Repo Rate ({vintage})",     ar: "سعر إعادة الشراء — ساما ({vintage})" },
  "mkt.capFloor":       { en: "Implied Cap Rate Floor (Repo +150bps)",
                          ar: "الحد الأدنى لمعدل الرسملة (سعر الإعادة +150 ن.أ.)" },
  "mkt.yieldSpread":    { en: "Yield Spread over Repo",         ar: "فارق العائد فوق سعر الإعادة" },
  "mkt.spreadAssess":   { en: "Spread Assessment",             ar: "تقييم الفارق" },

  // ── Confidence ────────────────────────────────────────────────────────────
  "conf.title":         { en: "Confidence Scoring",             ar: "درجة موثوقية التقدير" },
  "conf.cityData":      { en: "City Data",                      ar: "بيانات المدينة" },
  "conf.district":      { en: "District",                       ar: "الحي" },
  "conf.assetType":     { en: "Asset Type",                     ar: "نوع الأصل" },
  "conf.mktActivity":   { en: "Market Activity",                ar: "نشاط السوق" },

  // ── TAQEEM ────────────────────────────────────────────────────────────────
  "taqeem.title":       { en: "TAQEEM Compliance Signals",
                          ar: "إشارات الامتثال لمعايير هيئة التقييم (تقييم)" },

  // ── Methodology ───────────────────────────────────────────────────────────
  "meth.title":         { en: "Methodology & Limitations",      ar: "المنهجية والقيود" },
  "meth.p1":            { en: "AOUJ reconciles a sales comparison approach (comparable transactions, district-adjusted) with an income approach (NOI ÷ market cap rate, independently derived from rental comparables). Weights reflect asset class conventions used by institutional investors.",
                          ar: "يُرجِّح أوج بين مدخل مقارنة المبيعات (معاملات مماثلة مُعدَّلة وفق الحي) ومدخل الدخل (صافي الدخل التشغيلي ÷ معدل الرسملة السوقي المستنبط بصورة مستقلة من مقارنات الإيجار). تعكس الأوزان الأعراف المعتمدة لدى المستثمرين المؤسسيين." },
  "meth.p2":            { en: "Cap rates are sourced from investment transaction evidence (Q1 2026). Rental comparables are independently benchmarked from active lease market data. Neither dataset incorporates live REGA transaction feeds or TAQEEM-certified appraisals.",
                          ar: "تُستقى معدلات الرسملة من بيانات المعاملات الاستثمارية (الربع الأول 2026). تُستنبط مقارنات الإيجار بصورة مستقلة من بيانات السوق الإيجاري النشط. لا تتضمن قاعدة البيانات تغذية معاملات هيئة العقار (ريجا) الحية أو تقييمات معتمدة من هيئة التقييم." },
  "meth.islamicNote":   { en: "Islamic Finance Note: Conventional mortgage rates are shown as a proxy. Saudi buyers may alternatively structure acquisition via Murabaha or Ijara financing instruments compliant with SAMA and the Islamic Development Bank standards.",
                          ar: "ملاحظة حول التمويل الإسلامي: تُعرض معدلات التمويل التقليدي كمرجع مقارن. يمكن للمشترين السعوديين هيكلة عمليات الاقتناء عبر صيغ المرابحة أو الإيجار المنتهي بالتمليك وفق معايير ساما وبنك التنمية الإسلامي." },
  "meth.acquisitionNote": { en: "Acquisition Costs (estimate): Transfer tax 5% + Agent fee 2.5% + Registration 0.6% ≈ 8.1% on top of purchase price. White Land Tax (WLT) may apply to undeveloped parcels within urban boundaries.",
                            ar: "تكاليف الاقتناء (تقديرية): رسوم نقل الملكية 5% + عمولة الوسيط 2.5% + رسوم التسجيل 0.6% ≈ 8.1% فوق سعر الشراء. قد تُطبَّق رسوم الأراضي البيضاء على القطع غير المطورة ضمن النطاق العمراني." },

  // ── IRR / Return Analysis ─────────────────────────────────────────────────
  "irr.title":         { en: "Return Analysis",              ar: "تحليل العوائد" },
  "irr.note":          { en: "Directional only. Acq. costs: 8.1% (transfer 5% + agent 2.5% + reg. 0.6%). Disposal: 2.5%. NOI assumed fully distributable.",
                         ar: "توجيهي فقط. تكاليف الاقتناء: 8.1% (نقل 5% + وسيط 2.5% + تسجيل 0.6%). التصفية: 2.5%. يُفترض توزيع كامل صافي الدخل التشغيلي." },
  "irr.holdYears":     { en: "Hold Period",                  ar: "فترة الاحتفاظ" },
  "irr.rentGrowth":    { en: "Rent Growth (p.a.)",           ar: "نمو الإيجار (سنوياً)" },
  "irr.exitCap":       { en: "Exit Cap vs. Entry",           ar: "معدل الرسملة عند الخروج" },
  "irr.unlevered":     { en: "Unlevered IRR",                ar: "العائد الداخلي غير المُرفع" },
  "irr.levered":       { en: "Levered IRR",                  ar: "العائد الداخلي المُرفع" },
  "irr.moic":          { en: "MOIC",                         ar: "مضاعف رأس المال" },
  "irr.exitValue":     { en: "Exit Value (net)",             ar: "قيمة الخروج (صافي)" },
  "irr.totalOutlay":   { en: "Total Outlay",                 ar: "إجمالي الإنفاق" },
  "irr.equityIn":      { en: "Equity Invested",              ar: "حقوق الملكية المستثمرة" },
  "irr.entryCapRate":  { en: "Entry Cap",                    ar: "معدل رسملة الدخول" },
  "irr.exitCapRate":   { en: "Exit Cap",                     ar: "معدل رسملة الخروج" },
  "irr.noIncome":      { en: "Return analysis requires an income-producing asset with a Sale transaction.",
                         ar: "يتطلب تحليل العوائد أصلاً منتجاً للدخل مع معاملة بيع." },
  "irr.compress":      { en: "−50bps",                       ar: "−50 ن.أ." },
  "irr.flat":          { en: "Flat",                         ar: "مساوٍ" },
  "irr.expand50":      { en: "+50bps",                       ar: "+50 ن.أ." },
  "irr.expand100":     { en: "+100bps",                      ar: "+100 ن.أ." },
  "irr.levNote":       { en: "At SAMA max LTV",              ar: "عند الحد الأقصى لساما" },

  // ── Deal Pipeline ─────────────────────────────────────────────────────────
  "stage.Screening":      { en: "Screening",          ar: "الفرز الأولي" },
  "stage.Due Diligence":  { en: "Due Diligence",      ar: "العناية الواجبة" },
  "stage.IC Review":      { en: "IC Review",          ar: "مراجعة لجنة الاستثمار" },
  "stage.Approved":       { en: "Approved",           ar: "معتمد" },
  "stage.Rejected":       { en: "Rejected",           ar: "مرفوض" },
  "stage.Withdrawn":      { en: "Withdrawn",          ar: "مسحوب" },

  // ── Case Detail – new sections ────────────────────────────────────────────
  "detail.pipeline":      { en: "Deal Pipeline",             ar: "مسار الصفقة" },
  "detail.advanceStage":  { en: "Advance Stage",             ar: "تقدّم المرحلة" },
  "detail.close":         { en: "Close Deal",                ar: "إنهاء الصفقة" },
  "detail.decision":      { en: "Decision Record",           ar: "سجل القرار" },
  "detail.decisionIntro": { en: "Record the outcome and key rationale for the investment committee file.",
                            ar: "وثّق نتيجة القرار ومبرراته الرئيسية لملف لجنة الاستثمار." },
  "detail.decisionRat":   { en: "Decision Rationale",        ar: "مبررات القرار" },
  "detail.decisionPH":    { en: "Document the key basis for this decision — valuation view, risk factors, committee vote…",
                            ar: "وثّق الأسباب الرئيسية للقرار — الرأي التقييمي، عوامل المخاطر، تصويت اللجنة..." },
  "detail.decisionSave":  { en: "Record Decision",           ar: "تسجيل القرار" },
  "detail.decisionReopen":{ en: "Reopen",                    ar: "إعادة فتح" },
  "detail.auditLog":      { en: "Activity Log",              ar: "سجل النشاط" },
  "detail.icView":        { en: "IC View",                   ar: "عرض لجنة الاستثمار" },
  "detail.workingView":   { en: "Working View",              ar: "العرض التفصيلي" },
  "detail.print":         { en: "Print",                     ar: "طباعة" },
  "detail.icTitle":       { en: "Investment Committee Memo", ar: "مذكرة لجنة الاستثمار" },
  "detail.icConfid":      { en: "Confidential — Internal Use Only", ar: "سري — للاستخدام الداخلي فقط" },
  "detail.keyMetrics":    { en: "Key Metrics",               ar: "المؤشرات الرئيسية" },
  "detail.returnAnalysis":{ en: "Return Analysis",           ar: "تحليل العوائد" },
  "detail.assumNotes":    { en: "Assumption Sources",        ar: "مصادر الافتراضات" },
  "detail.assumPH":       { en: "Document data sources, comparable transactions referenced, appraiser inputs, or any non-standard assumptions…",
                            ar: "وثّق مصادر البيانات، والمعاملات المقارنة المرجعية، ومدخلات المقيّم، أو أي افتراضات غير معيارية..." },
  "detail.assumSave":     { en: "Save Notes",                ar: "حفظ الملاحظات" },
  "detail.outcome.Approved": { en: "Approved",               ar: "معتمد" },
  "detail.outcome.Rejected": { en: "Rejected",               ar: "مرفوض" },
  "detail.outcome.Withdrawn":{ en: "Withdrawn",              ar: "مسحوب" },

  // ── Checklist categories ──────────────────────────────────────────────────
  "chk.cat.title":      { en: "Title & Ownership",           ar: "الملكية والصكوك" },
  "chk.cat.regulatory": { en: "Regulatory & Planning",       ar: "التنظيم والتخطيط" },
  "chk.cat.physical":   { en: "Physical & Technical",        ar: "الفحص المادي والتقني" },
  "chk.cat.financial":  { en: "Financial",                   ar: "المالي" },

  // ── New checklist items ───────────────────────────────────────────────────
  "chk.REGA registration confirmed":         { en: "REGA registration confirmed",         ar: "تأكيد التسجيل في هيئة العقار" },
  "chk.Mortgage / encumbrance clearance":    { en: "Mortgage / encumbrance clearance",    ar: "خلو الرهن والأعباء" },
  "chk.Joint ownership (shuyu') confirmed":  { en: "Joint ownership (shuyu') confirmed",  ar: "تأكيد الملكية المشتركة (الشيوع)" },
  "chk.Boundary and area matches Sak":       { en: "Boundary and area matches Sak",       ar: "تطابق الحدود والمساحة مع الصك" },
  "chk.Zoning / permitted use verified":     { en: "Zoning / permitted use verified",     ar: "التحقق من التخطيط والاستخدام المسموح" },
  "chk.Wafi registration (if off-plan)":     { en: "Wafi registration (if off-plan)",     ar: "تسجيل وافي (للمشاريع على الخارطة)" },
  "chk.White Land Tax (WLT) status checked": { en: "White Land Tax (WLT) status checked", ar: "فحص حالة رسوم الأراضي البيضاء" },
  "chk.Physical inspection conducted":       { en: "Physical inspection conducted",       ar: "إجراء الفحص المادي" },
  "chk.Structural survey completed":         { en: "Structural survey completed",         ar: "اكتمال المسح الهيكلي" },
  "chk.Service charges / HOA settled":       { en: "Service charges / HOA settled",       ar: "تسوية رسوم الخدمات / اتحاد الملاك" },
  "chk.Rental income verified (if income-producing)": { en: "Rental income verified (if income-producing)", ar: "التحقق من دخل الإيجار (إن وجد)" },
  "chk.Zakat / tax clearance obtained":      { en: "Zakat / tax clearance obtained",      ar: "الحصول على شهادة براءة الذمة (الزكاة والضريبة)" },

  // ── Cases List ────────────────────────────────────────────────────────────
  "cases.empty":        { en: "No cases saved yet.",            ar: "لا توجد ملفات محفوظة بعد." },
  "cases.emptyHint":    { en: "Run a valuation and click Save as Case to see it here.",
                          ar: "أجرِ تقييماً وانقر على «حفظ كملف» لعرضه هنا." },
  "cases.title":        { en: "Saved Cases",                    ar: "الملفات المحفوظة" },
  "cases.count1":       { en: "1 case",                         ar: "ملف واحد" },
  "cases.countN":       { en: "{n} cases",                      ar: "{n} ملفات" },
  "cases.checklist":    { en: "{done}/{total} checklist items",  ar: "{done}/{total} من بنود قائمة العناية الواجبة" },
  "cases.note1":        { en: "1 legal note",                   ar: "ملاحظة قانونية واحدة" },
  "cases.noteN":        { en: "{n} legal notes",                ar: "{n} ملاحظات قانونية" },
  "cases.note0":        { en: "0 legal notes",                  ar: "لا توجد ملاحظات" },

  // ── Case Detail ───────────────────────────────────────────────────────────
  "detail.notFound":    { en: "Case not found.",                ar: "الملف غير موجود." },
  "detail.back":        { en: "Cases",                          ar: "الملفات" },
  "detail.backFull":    { en: "Back to Cases",                  ar: "العودة إلى الملفات" },
  "detail.created":     { en: "Created",                        ar: "تاريخ الإنشاء" },
  "detail.status":      { en: "Status:",                        ar: "الحالة:" },
  "detail.propDetails": { en: "Property Details",               ar: "تفاصيل العقار" },
  "detail.city":        { en: "City",                           ar: "المدينة" },
  "detail.district":    { en: "District",                       ar: "الحي" },
  "detail.type":        { en: "Type",                           ar: "النوع" },
  "detail.size":        { en: "Size",                           ar: "المساحة" },
  "detail.sqm":         { en: "sqm",                            ar: "م²" },
  "detail.condition":   { en: "Condition",                      ar: "الحالة" },
  "detail.tx":          { en: "Transaction",                    ar: "نوع المعاملة" },
  "detail.valuation":   { en: "Valuation Estimate",             ar: "تقدير القيمة" },
  "detail.rangeLabel":  { en: "Estimated Range (SAR)",          ar: "النطاق التقديري (ريال سعودي)" },
  "detail.checklist":   { en: "Due Diligence Checklist",        ar: "قائمة العناية الواجبة" },
  "detail.complete":    { en: "complete",                       ar: "مكتملة" },
  "detail.legal":       { en: "Legal Review",                   ar: "المراجعة القانونية" },
  "detail.noNotes":     { en: "No notes yet.",                  ar: "لا توجد ملاحظات بعد." },
  "detail.notePlaceholder": { en: "Add a legal note…",          ar: "أضف ملاحظة قانونية..." },
  "detail.deleteNote":  { en: "Delete note",                    ar: "حذف الملاحظة" },

  // ── Status labels ─────────────────────────────────────────────────────────
  "status.Draft":       { en: "Draft",                          ar: "مسودة" },
  "status.In Review":   { en: "In Review",                      ar: "قيد المراجعة" },
  "status.Approved":    { en: "Approved",                       ar: "معتمد" },
  "status.Closed":      { en: "Closed",                         ar: "مغلق" },
  "status.Pending":     { en: "Pending",                        ar: "معلّق" },

  // ── Confidence levels ─────────────────────────────────────────────────────
  "conf.High":          { en: "High",                           ar: "عالية" },
  "conf.Medium":        { en: "Medium",                         ar: "متوسطة" },
  "conf.Low":           { en: "Low",                            ar: "منخفضة" },

  // ── Checklist item labels (for bilingual display) ────────────────────────
  "chk.Title deed (Sak) verified":       { en: "Title deed (Sak) verified",        ar: "التحقق من صك الملكية" },
  "chk.Municipal permit confirmed":      { en: "Municipal permit confirmed",        ar: "تأكيد رخصة البلدية" },
  "chk.Property survey conducted":       { en: "Property survey conducted",         ar: "إجراء مسح العقار" },
  "chk.Mortgage clearance obtained":     { en: "Mortgage clearance obtained",       ar: "الحصول على خلو الرهن" },
  "chk.REGA registration checked":       { en: "REGA registration checked",         ar: "التحقق من تسجيل الهيئة العامة للعقار" },
  "chk.Outstanding utilities cleared":   { en: "Outstanding utilities cleared",     ar: "تسوية المستحقات والخدمات" },
} as const;

// ─── Arabic city / district / type name maps ─────────────────────────────────

export const CITY_AR: Record<string, string> = {
  Riyadh:  "الرياض",
  Jeddah:  "جدة",
  Makkah:  "مكة المكرمة",
  Medina:  "المدينة المنورة",
  Dammam:  "الدمام",
  Khobar:  "الخبر",
  Abha:    "أبها",
};

export const DISTRICT_AR: Record<string, string> = {
  // Riyadh
  "Al Olaya":        "العليا",
  "Al Sulaimaniyah": "السليمانية",
  "Hitteen":         "حطين",
  "Al Nakheel":      "النخيل",
  "Al Yasmin":       "الياسمين",
  "Al Rabwah":       "الربوة",
  "Al Malaz":        "الملز",
  "Al Rawabi":       "الروابي",
  // Jeddah
  "Al Hamra":        "الحمراء",
  "Al Shati":        "الشاطئ",
  "Al Zahraa":       "الزهراء",
  "Al Rawdah":       "الروضة",
  "Al Safa":         "الصفا",
  "Al Marjaan":      "المرجان",
  "Al Balad":        "البلد",
  // Makkah
  "Al Aziziyah":     "العزيزية",
  "Al Nuzha":        "النزهة",
  "Al Awali":        "العوالي",
  "Batha Quraysh":   "بطحاء قريش",
  "Al Zaher":        "الزاهر",
  // Medina
  "Al Haram":        "الحرم",
  "Quba":            "قباء",
  "Al Anbariyah":    "العنبرية",
  "Al Aqoul":        "العقول",
  // Dammam
  "Al Faisaliyah":   "الفيصلية",
  "Al Shatea":       "الشاطئ",
  "Al Muraikabat":   "المريكبات",
  "Al Noor":         "النور",
  "Al Badiyah":      "البادية",
  // Khobar
  "Al Thuqbah":      "الثقبة",
  "Al Ulaya":        "العليا",
  "Prince Turki":    "حي الأمير تركي",
  "Al Rakah":        "الراكة",
  // Abha
  "Al Maather":      "المعاثر",
  "Al Namas":        "النماص",
  "Al Mansoura":     "المنصورة",
  "Al Sad":          "السد",
};

export const PROPERTY_TYPE_AR: Record<string, string> = {
  "Residential Villa": "فيلا سكنية",
  "Apartment":         "شقة سكنية",
  "Commercial":        "عقار تجاري",
  "Office":            "مكتب",
  "Land":              "أرض",
  "Warehouse":         "مستودع",
};

export const CONDITION_AR: Record<string, string> = {
  "Excellent": "ممتاز",
  "Good":      "جيد",
  "Fair":      "مقبول",
  "Poor":      "ضعيف",
};

export const TX_TYPE_AR: Record<string, string> = {
  "Sale": "بيع",
  "Rent": "إيجار",
};

// ─── Translation function ─────────────────────────────────────────────────────

type DictKey = keyof typeof dict;

export function t(key: string, lang: Lang, vars?: Record<string, string | number>): string {
  const entry = dict[key as DictKey];
  if (!entry) return key;
  let text: string = entry[lang];
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(`{${k}}`, String(v));
    }
  }
  return text;
}

// Localise a city name
export function cityName(city: string, lang: Lang): string {
  return lang === "ar" ? (CITY_AR[city] ?? city) : city;
}

// Localise a district name
export function districtName(district: string, lang: Lang): string {
  return lang === "ar" ? (DISTRICT_AR[district] ?? district) : district;
}

// Localise a property type
export function propTypeName(type: string, lang: Lang): string {
  return lang === "ar" ? (PROPERTY_TYPE_AR[type] ?? type) : type;
}

// Localise a condition
export function conditionName(cond: string, lang: Lang): string {
  return lang === "ar" ? (CONDITION_AR[cond] ?? cond) : cond;
}

// Localise a transaction type
export function txTypeName(tx: string, lang: Lang): string {
  return lang === "ar" ? (TX_TYPE_AR[tx] ?? tx) : tx;
}

// Localise a checklist item label
export function checklistLabel(label: string, lang: Lang): string {
  const key = `chk.${label}` as DictKey;
  const entry = dict[key];
  return entry ? entry[lang] : label;
}
