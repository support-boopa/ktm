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

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const { data: games } = await supabase
      .from("games")
      .select("title, category, genre, views, rating, size, developer, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    const { data: categories } = await supabase
      .from("categories")
      .select("name, slug, count");

    const { data: allGames } = await supabase.from("games").select("views, rating");
    const totalViews = allGames?.reduce((sum, g) => sum + (g.views || 0), 0) || 0;
    const avgRating = allGames?.length 
      ? (allGames.reduce((sum, g) => sum + (g.rating || 0), 0) / allGames.length).toFixed(1)
      : 0;

    const systemPrompt = `أنت مساعد ذكاء اصطناعي متقدم اسمك "KTM AI Trend" تعمل داخل موقع "كَتَم" (KTM) المتخصص في تحميل الألعاب.

**تعليمات اللغة المهمة:**
- اكتشف لغة رسالة المستخدم تلقائياً
- رد دائماً بنفس لغة المستخدم
- إذا كتب بالإنجليزية، رد بالإنجليزية
- إذا كتب بالعربية، رد بالعربية

معلومات المستخدم: ${userContext?.name || 'مستخدم'} - ${userContext?.email || ''}

=== إحصائيات الموقع ===
- إجمالي الألعاب: ${allGames?.length || 0}
- إجمالي المشاهدات: ${totalViews.toLocaleString()}
- متوسط التقييم: ${avgRating}

=== أحدث الألعاب ===
${games?.slice(0, 15).map((g, i) => `${i + 1}. ${g.title} | ${g.genre || g.category} | ⭐${g.rating || 'N/A'} | 👁️${g.views}`).join('\n') || 'لا توجد ألعاب'}

=== قدراتك ===
1. الإجابة عن أي سؤال يخص الموقع
2. البحث عن ألعاب الترند من Steam, Epic, PlayStation, Xbox
3. تقديم توصيات مخصصة
4. اكتشاف المشاكل وتقديم تقارير (بدون تفاصيل تقنية للثغرات)

=== تعليمات مهمة ===
- رد بنفس لغة المستخدم دائماً
- لا تشارك معلومات مستخدمين آخرين
- عند البحث عن ترند، قدم JSON إذا طُلب`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
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