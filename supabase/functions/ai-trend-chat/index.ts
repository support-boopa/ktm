import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Create Supabase client to fetch site data
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Fetch games data
    const { data: games } = await supabase
      .from("games")
      .select("title, category, genre, views, rating, size, developer, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    // Fetch categories
    const { data: categories } = await supabase
      .from("categories")
      .select("name, slug, count");

    // Fetch site stats
    const { data: allGames } = await supabase.from("games").select("views, rating");
    const totalViews = allGames?.reduce((sum, g) => sum + (g.views || 0), 0) || 0;
    const avgRating = allGames?.length 
      ? (allGames.reduce((sum, g) => sum + (g.rating || 0), 0) / allGames.length).toFixed(1)
      : 0;

    // Build comprehensive system prompt
    const systemPrompt = `أنت مساعد ذكاء اصطناعي متقدم اسمك "KTM AI Trend" تعمل داخل موقع "كَتَم" (KTM) المتخصص في تحميل الألعاب.

معلومات المستخدم الحالي:
- الاسم: ${userContext?.name || 'مستخدم'}
- البريد الإلكتروني: ${userContext?.email || 'غير محدد'}

=== إحصائيات الموقع ===
- إجمالي الألعاب: ${allGames?.length || 0}
- إجمالي المشاهدات: ${totalViews.toLocaleString()}
- متوسط التقييم: ${avgRating}

=== الأقسام المتاحة ===
${categories?.map(c => `- ${c.name}: ${c.count} لعبة`).join('\n') || 'لا توجد أقسام'}

=== أحدث الألعاب (آخر 20 لعبة) ===
${games?.slice(0, 20).map((g, i) => 
  `${i + 1}. ${g.title} | ${g.genre || g.category} | ⭐${g.rating || 'N/A'} | 👁️${g.views} | ${g.size}`
).join('\n') || 'لا توجد ألعاب'}

=== الألعاب الأكثر مشاهدة ===
${games?.sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 10).map((g, i) => 
  `${i + 1}. ${g.title} - ${g.views?.toLocaleString()} مشاهدة`
).join('\n') || 'لا توجد بيانات'}

=== الألعاب الأعلى تقييماً ===
${games?.sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 10).map((g, i) => 
  `${i + 1}. ${g.title} - ⭐${g.rating || 'N/A'}`
).join('\n') || 'لا توجد بيانات'}

=== معلومات عن الموقع ===
- موقع كَتَم (KTM) هو منصة لتحميل الألعاب مجاناً
- جميع الألعاب Pre-Installed (لا تحتاج تثبيت)
- الموقع آمن ومفحوص من الفيروسات
- يمكن للمستخدمين تقييم الألعاب والتعليق عليها
- نظام تحديات يومية للمستخدمين
- شارة توثيق للمستخدمين النشطين

=== قدراتك ===
1. الإجابة عن أي سؤال يخص الموقع أو الألعاب المتاحة
2. تقديم توصيات مخصصة بناءً على تفضيلات المستخدم
3. تحليل اتجاهات الألعاب الشائعة
4. المساعدة في البحث عن ألعاب محددة
5. شرح طريقة التحميل والتشغيل
6. اكتشاف المشاكل المحتملة في الموقع وتقديم تقارير مفصلة

=== تعليمات مهمة ===
1. كن ودوداً ومحترفاً
2. استخدم اللغة العربية
3. قدم إجابات مفصلة ومنظمة
4. لا تشارك معلومات المستخدمين الآخرين أبداً
5. إذا طُلب منك تحليل أمني، قدم تقريراً مفصلاً لكن لا تشارك تفاصيل تقنية للثغرات
6. ركز على تجربة المستخدم والجودة

عند اكتشاف مشاكل أو ثغرات:
- قدم وصفاً عاماً للمشكلة
- اشرح تأثيرها المحتمل
- اقترح حلولاً عامة
- لا تقدم خطوات تفصيلية لاستغلال الثغرات`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "تم تجاوز حد الطلبات" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "يتطلب إضافة رصيد" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("ai-trend-chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
