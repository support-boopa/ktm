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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { userId, challengeId, action, actionData } = await req.json();

    console.log("Verifying challenge:", { userId, challengeId, action, actionData });

    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing userId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle auto-verification for all matching challenges
    if (challengeId === 'auto') {
      const now = new Date().toISOString();
      
      // Get all incomplete challenges for user
      const { data: challenges } = await supabase
        .from("user_challenges")
        .select("*")
        .eq("user_id", userId)
        .eq("is_completed", false)
        .gt("expires_at", now);

      if (!challenges || challenges.length === 0) {
        return new Response(JSON.stringify({ verified: false, message: "لا توجد تحديات نشطة" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let anyVerified = false;
      for (const challenge of challenges) {
        const result = await verifySingleChallenge(supabase, LOVABLE_API_KEY, userId, challenge, action, actionData);
        if (result.verified) {
          anyVerified = true;
        }
      }

      return new Response(JSON.stringify({ 
        verified: anyVerified, 
        message: anyVerified ? "تم إنجاز التحدي!" : "لم يتم التحقق بعد" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get specific challenge
    const { data: challenge, error: challengeError } = await supabase
      .from("user_challenges")
      .select("*")
      .eq("id", challengeId)
      .eq("user_id", userId)
      .single();

    if (challengeError || !challenge) {
      return new Response(JSON.stringify({ error: "Challenge not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await verifySingleChallenge(supabase, LOVABLE_API_KEY, userId, challenge, action, actionData);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error verifying challenge:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function verifySingleChallenge(
  supabase: any,
  LOVABLE_API_KEY: string | undefined,
  userId: string,
  challenge: any,
  action: string,
  actionData?: Record<string, any>
): Promise<{ verified: boolean; message: string }> {
  if (challenge.is_completed) {
    return { verified: true, message: "التحدي مكتمل مسبقاً" };
  }

  // Parse challenge description for verification data
  let verificationData: any = {};
  try {
    const desc = JSON.parse(challenge.challenge_description || "{}");
    verificationData = desc.verification_data || {};
  } catch (e) {
    console.log("No structured verification data");
  }

  let verified = false;
  let message = "";
  
  const challengeType = challenge.challenge_type?.toLowerCase() || "";
  const challengeText = challenge.challenge_text?.toLowerCase() || "";

  // Check if action matches challenge type
  const isCommentChallenge = challengeType === "comment" || challengeText.includes("تعليق") || challengeText.includes("اكتب");
  const isRatingChallenge = challengeType === "rate_games" || challengeText.includes("قيّم") || challengeText.includes("تقييم");
  const isFavoritesChallenge = challengeType === "add_favorites" || challengeText.includes("مفضل");
  const isAvatarChallenge = challengeType === "avatar_change" || challengeText.includes("صورة") || challengeText.includes("أفتار");

  // Comment challenge verification
  if (action === "comment" && isCommentChallenge && actionData?.content) {
    const requiredText = verificationData.required_text?.toLowerCase() || "";
    const commentText = actionData.content.toLowerCase();
    
    // Extract required text from challenge_text (look for text in quotes)
    const quotePatterns = [
      /["""']([^"""']+)["""']/,  // Arabic/English quotes
      /يقول[:\s]*["""']?([^"""']+)["""']?/,  // After "يقول"
      /يحتوي على[:\s]*["""']?([^"""']+)["""']?/  // After "يحتوي على"
    ];
    
    let alternateRequired = "";
    for (const pattern of quotePatterns) {
      const match = challenge.challenge_text?.match(pattern);
      if (match?.[1]) {
        alternateRequired = match[1].toLowerCase().trim();
        break;
      }
    }
    
    console.log("Comment verification:", {
      commentText,
      requiredText,
      alternateRequired,
      challengeText: challenge.challenge_text
    });
    
    // Check if comment contains required text
    if ((requiredText && commentText.includes(requiredText)) || 
        (alternateRequired && commentText.includes(alternateRequired))) {
      verified = true;
      message = "تم التحقق من التعليق بنجاح! 🎉";
    } else {
      // Check for partial match or similar content
      const textToMatch = requiredText || alternateRequired;
      if (textToMatch) {
        const similarity = calculateSimilarity(textToMatch, commentText);
        console.log("Similarity score:", similarity);
        if (similarity > 0.4) {
          verified = true;
          message = "تم قبول التعليق! 🎉";
        }
      }
    }
  }

  // Rating challenge verification
  if (action === "rate_games" && isRatingChallenge) {
    const requiredRatings = verificationData.required_count || 1;
    const { count: ratingCount } = await supabase
      .from("game_ratings")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if ((ratingCount || 0) >= requiredRatings) {
      verified = true;
      message = `تم تقييم ${ratingCount} ألعاب!`;
    }
  }

  // Favorites challenge verification
  if (action === "add_favorites" && isFavoritesChallenge) {
    const requiredFavorites = verificationData.required_count || 1;
    const { count: favCount } = await supabase
      .from("user_favorites")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if ((favCount || 0) >= requiredFavorites) {
      verified = true;
      message = `تم إضافة ${favCount} ألعاب للمفضلة!`;
    }
  }

  // Avatar change verification
  if (action === "avatar_change" && isAvatarChallenge && actionData?.avatarUrl && LOVABLE_API_KEY) {
    const avatarDescription = verificationData.avatar_description || "";
    
    try {
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `هل هذه الصورة تطابق الوصف التالي بنسبة 70% أو أكثر؟
الوصف المطلوب: "${avatarDescription}"

أجب بـ "نعم" أو "لا" فقط.`
                },
                {
                  type: "image_url",
                  image_url: { url: actionData.avatarUrl }
                }
              ]
            }
          ],
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        const response = aiData.choices?.[0]?.message?.content?.toLowerCase() || "";
        
        if (response.includes("نعم") || response.includes("yes")) {
          verified = true;
          message = "تم التحقق من صورة الأفتار!";
        }
      }
    } catch (e) {
      console.error("AI verification error:", e);
    }
  }

  // Mark challenge as completed if verified
  if (verified) {
    await supabase
      .from("user_challenges")
      .update({ 
        is_completed: true, 
        completed_at: new Date().toISOString() 
      })
      .eq("id", challenge.id);

    // Record completion
    await supabase
      .from("challenge_completions")
      .insert({
        user_id: userId,
        challenge_id: challenge.id
      });

    // Check verification status
    await checkAndUpdateVerification(supabase, userId);
  }

  return { 
    verified, 
    message: message || (verified ? "تم إنجاز التحدي!" : "لم يتم التحقق بعد") 
  };
}

// Helper function to calculate text similarity
function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  const set1 = new Set(str1.split(" "));
  const set2 = new Set(str2.split(" "));
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return intersection.size / union.size;
}

// Check and update user verification status
async function checkAndUpdateVerification(supabase: any, userId: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { count } = await supabase
    .from("challenge_completions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("completed_at", thirtyDaysAgo.toISOString());

  const isVerified = (count || 0) >= 30;
  
  if (isVerified) {
    const verifiedUntil = new Date();
    verifiedUntil.setDate(verifiedUntil.getDate() + 30);
    
    await supabase
      .from("profiles")
      .update({ 
        is_verified: true,
        verified_until: verifiedUntil.toISOString()
      })
      .eq("user_id", userId);
  }
}
