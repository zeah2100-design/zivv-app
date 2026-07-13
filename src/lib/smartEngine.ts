// Smart Engine - Personal AI for zivv
// Provides recommendations, insights, and automation

import { db } from "@/db";
import { users, posts, friendships, likes, comments, statuses, messages, chats } from "@/db/schema";
import { and, eq, ne, or, sql, desc, inArray, gte, count, countDistinct } from "drizzle-orm";
import { xaiChat, xaiGenerateCaptions, xaiGenerateTags } from "./xai";

export type SmartInsight = {
  type: "suggestion" | "opportunity" | "achievement" | "warning" | "info";
  title: string;
  message: string;
  action?: { label: string; href: string };
  icon: string;
};

export type SmartRecommendation = {
  userId: number;
  firstName: string;
  lastName: string;
  avatarColor: string | null;
  reason: string;
  score: number;
  mutualFriends: number;
};

// === Personal Smart Feed ===
export async function getSmartFeed(userId: number, limit = 20) {
  // Get user's interests
  const me = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (me.length === 0) return [];
  const myInterests: string[] = (me[0].interests as string[]) || [];

  // Get all posts from friends + my own
  const friends = await db
    .select()
    .from(friendships)
    .where(
      and(
        or(eq(friendships.requesterId, userId), eq(friendships.addresseeId, userId)),
        eq(friendships.status, "accepted")
      )
    );

  const friendIds = new Set<number>();
  friends.forEach((f) => {
    friendIds.add(f.requesterId === userId ? f.addresseeId : f.requesterId);
  });
  friendIds.add(userId);

  const allPosts = await db
    .select({
      id: posts.id,
      userId: posts.userId,
      content: posts.content,
      mediaType: posts.mediaType,
      mediaUrl: posts.mediaUrl,
      musicName: posts.musicName,
      tags: posts.tags,
      views: posts.views,
      likes: posts.likes,
      createdAt: posts.createdAt,
    })
    .from(posts)
    .where(inArray(posts.userId, Array.from(friendIds)))
    .orderBy(desc(posts.createdAt))
    .limit(50);

  // Score each post based on:
  // - Recency (newer = higher)
  // - Engagement (likes/views)
  // - Interest match (tag overlap with user interests)
  // - Friend priority (close friends first)
  const now = Date.now();
  const scored = allPosts.map((p) => {
    const ageHours = (now - new Date(p.createdAt).getTime()) / (1000 * 60 * 60);
    const recency = Math.max(0, 100 - ageHours * 2);
    const engagement = Math.min(100, p.likes * 5 + p.views * 0.5);
    const tags: string[] = (p.tags as string[]) || [];
    const interestMatch = myInterests.length
      ? (tags.filter((t) => myInterests.includes(t)).length / myInterests.length) * 100
      : 0;
    const isOwn = p.userId === userId;
    const ownBoost = isOwn ? -50 : 0; // demote own posts in feed
    const score = recency * 0.3 + engagement * 0.4 + interestMatch * 0.3 + ownBoost;
    return { ...p, score, reason: generateReason(p, score, interestMatch) };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

function generateReason(post: { tags: string[] | null; likes: number; views: number }, score: number, interestMatch: number): string {
  if (interestMatch > 50) return "🎯 يطابق اهتماماتك";
  if (post.likes > 20) return "🔥 منشور رائج";
  if (post.views > 100) return "👁 منشور مشهور";
  if (score > 80) return "✨ موصى به لك";
  return "";
}

// === Smart Friend Recommendations ===
export async function getFriendRecommendations(userId: number, limit = 10): Promise<SmartRecommendation[]> {
  // Get my friends
  const myFriends = await db
    .select()
    .from(friendships)
    .where(
      and(
        or(eq(friendships.requesterId, userId), eq(friendships.addresseeId, userId)),
        eq(friendships.status, "accepted")
      )
    );
  const myFriendIds = new Set<number>();
  myFriends.forEach((f) => {
    myFriendIds.add(f.requesterId === userId ? f.addresseeId : f.requesterId);
  });

  // Get all users except me
  const allUsers = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      avatarColor: users.avatarColor,
      interests: users.interests,
    })
    .from(users)
    .where(ne(users.id, userId))
    .limit(100);

  // Get friends of friends
  const fof = new Map<number, number>();
  for (const f of myFriends) {
    const friendId = f.requesterId === userId ? f.addresseeId : f.requesterId;
    const friendOfFriend = await db
      .select()
      .from(friendships)
      .where(
        and(
          or(eq(friendships.requesterId, friendId), eq(friendships.addresseeId, friendId)),
          eq(friendships.status, "accepted")
        )
      );
    for (const fofRel of friendOfFriend) {
      const candidateId = fofRel.requesterId === friendId ? fofRel.addresseeId : fofRel.requesterId;
      if (candidateId === userId || myFriendIds.has(candidateId)) continue;
      fof.set(candidateId, (fof.get(candidateId) || 0) + 1);
    }
  }

  // Get my interests
  const me = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const myInterests: string[] = (me[0]?.interests as string[]) || [];

  // Score users
  const recommendations: SmartRecommendation[] = allUsers
    .filter((u) => !myFriendIds.has(u.id))
    .map((u) => {
      const mutualFriends = fof.get(u.id) || 0;
      const theirInterests: string[] = (u.interests as string[]) || [];
      const sharedInterests = theirInterests.filter((i) => myInterests.includes(i)).length;
      const score = mutualFriends * 30 + sharedInterests * 20 + 10;

      let reason = "";
      if (mutualFriends >= 3) reason = `👥 ${mutualFriends} أصدقاء مشتركين`;
      else if (mutualFriends > 0) reason = `👥 ${mutualFriends} ${mutualFriends === 1 ? "صديق مشترك" : "أصدقاء مشتركين"}`;
      else if (sharedInterests > 0) reason = `✨ ${sharedInterests} اهتمامات مشتركة`;
      else reason = "🆕 مستخدم جديد";

      return {
        userId: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        avatarColor: u.avatarColor,
        reason,
        score,
        mutualFriends,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return recommendations;
}

// === Smart Insights Dashboard ===
export async function getSmartInsights(userId: number): Promise<SmartInsight[]> {
  const insights: SmartInsight[] = [];

  // 1. Best time to post
  const myPosts = await db
    .select()
    .from(posts)
    .where(eq(posts.userId, userId))
    .orderBy(desc(posts.createdAt))
    .limit(20);

  if (myPosts.length >= 3) {
    const hourCounts = new Map<number, number>();
    myPosts.forEach((p) => {
      const hour = new Date(p.createdAt).getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    });
    const sortedHours = Array.from(hourCounts.entries()).sort((a, b) => b[1] - a[1]);
    if (sortedHours.length > 0) {
      const [bestHour] = sortedHours[0];
      insights.push({
        type: "info",
        title: "⏰ أفضل وقت للنشر",
        message: `منشوراتك تحقق تفاعلاً أكثر عند الساعة ${bestHour}:00. حاول النشر في هذا الوقت.`,
        icon: "⏰",
      });
    }
  }

  // 2. Engagement trend
  if (myPosts.length >= 2) {
    const lastPost = myPosts[0];
    const prevPost = myPosts[1];
    if (lastPost.likes > prevPost.likes) {
      insights.push({
        type: "achievement",
        title: "📈 تفاعل متزايد!",
        message: `منشورك الأخير حصل على ${lastPost.likes} إعجاب مقارنة بـ ${prevPost.likes} في السابق. أحسنت!`,
        icon: "📈",
      });
    } else if (lastPost.likes < prevPost.likes) {
      insights.push({
        type: "warning",
        title: "📉 تفاعل متناقص",
        message: `منشورك الأخير حصل على ${lastPost.likes} إعجاب فقط. جرب محتوى مختلف أو تفاعل مع أصدقائك.`,
        icon: "📉",
      });
    }
  }

  // 3. Pending friend requests
  const pending = await db
    .select({ count: count() })
    .from(friendships)
    .where(
      and(eq(friendships.addresseeId, userId), eq(friendships.status, "pending"))
    );
  const pendingCount = Number(pending[0]?.count || 0);
  if (pendingCount > 0) {
    insights.push({
      type: "opportunity",
      title: "📬 طلبات صداقة جديدة",
      message: `لديك ${pendingCount} ${pendingCount === 1 ? "طلب" : "طلبات"} صداقة في انتظارك.`,
      action: { label: "مراجعة الطلبات", href: "/friends" },
      icon: "📬",
    });
  }

  // 4. Unread messages check (we don't have read receipts, but we can show recent)
  const recentMessages = await db
    .select({ count: countDistinct(messages.chatId) })
    .from(messages)
    .innerJoin(chats, eq(chats.id, messages.chatId))
    .where(
      and(
        ne(messages.senderId, userId),
        or(eq(chats.userAId, userId), eq(chats.userBId, userId))
      )
    );

  // 5. Suggest new friend
  const recs = await getFriendRecommendations(userId, 1);
  if (recs.length > 0 && recs[0].mutualFriends >= 2) {
    insights.push({
      type: "suggestion",
      title: "👥 قد تعرفهم",
      message: `${recs[0].firstName} ${recs[0].lastName} - ${recs[0].reason}`,
      action: { label: "عرض الملف", href: `/profile/${recs[0].userId}` },
      icon: "👥",
    });
  }

  // 6. Streak / activity
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentPostCount = await db
    .select({ count: count() })
    .from(posts)
    .where(and(eq(posts.userId, userId), gte(posts.createdAt, weekAgo)));
  const count7d = Number(recentPostCount[0]?.count || 0);
  if (count7d >= 5) {
    insights.push({
      type: "achievement",
      title: "🔥 نشط جداً!",
      message: `نشرت ${count7d} منشورات هذا الأسبوع. استمر!`,
      icon: "🔥",
    });
  } else if (count7d === 0) {
    insights.push({
      type: "info",
      title: "💡 شاركنا أفكارك",
      message: "لم تنشر شيئاً هذا الأسبوع. ما الذي يشغلك؟",
      action: { label: "نشر الآن", href: "/post" },
      icon: "💡",
    });
  }

  return insights;
}

// === Smart Caption Generator ===
export async function generateSmartCaption(imageBase64?: string, topic?: string): Promise<string[]> {
  return xaiGenerateCaptions(topic || "عام");
}

// === Auto-tag Generator ===
export async function generateSmartTags(content: string): Promise<string[]> {
  return xaiGenerateTags(content);
}

// === Smart Post Analytics Summary ===
export async function getPostAnalytics(postId: number, ownerId: number) {
  // Verify ownership
  const post = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
  if (post.length === 0 || post[0].userId !== ownerId) return null;

  const commentsList = await db.select().from(comments).where(eq(comments.postId, postId));
  const likesList = await db.select().from(likes).where(eq(likes.postId, postId));

  // Best time of day for this post
  const postHour = new Date(post[0].createdAt).getHours();
  const engagementRate = post[0].views > 0 ? (post[0].likes / post[0].views) * 100 : 0;

  // Get AI summary
  let summary = "";
  try {
    summary = await xaiChat(
      `قدم ملخصاً قصيراً (جملتين) عن أداء هذا المنشور: ${post[0].likes} إعجاب، ${post[0].views} مشاهدة، ${commentsList.length} تعليق. نسبة التفاعل ${engagementRate.toFixed(1)}%.`,
      []
    );
  } catch {}

  return {
    post: post[0],
    likesCount: likesList.length,
    commentsCount: commentsList.length,
    engagementRate: engagementRate.toFixed(1),
    postHour,
    summary,
  };
}
