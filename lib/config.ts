import { supabase } from "@/lib/supabase";

export const defaultConfig = {
    sectionOrder: ['ayat', 'timeline', 'pengantar', 'cpw', 'cpp', 'acara', 'countdown', 'galeri', 'rekening', 'rsvp', 'thankyou'],
    coupleNames: process.env.NEXT_PUBLIC_COUPLE_NAMES || "Default Names",
    eventDate: process.env.NEXT_PUBLIC_EVENT_DATE || "2025-01-01T00:00:00",
    groom: process.env.NEXT_PUBLIC_GROOM_NAME || "Default Groom",
    groomNickName: process.env.NEXT_PUBLIC_GROOM_NICKNAME || "Default Nickname",
    groomInstagram: process.env.NEXT_PUBLIC_GROOM_INSTAGRAM || "Default Instagram",
    groomBio: process.env.NEXT_PUBLIC_GROOM_BIO || "Default Bio",
    bride: process.env.NEXT_PUBLIC_BRIDE_NAME || "Default Bride",
    brideNickName: process.env.NEXT_PUBLIC_BRIDE_NICKNAME || "Default Nickname",
    brideInstagram: process.env.NEXT_PUBLIC_BRIDE_INSTAGRAM || "Default Instagram",
    brideBio: process.env.NEXT_PUBLIC_BRIDE_BIO || "Default Bio",
    brideGroomTitle: process.env.NEXT_PUBLIC_BRIDE_GROOM_TITLE || "Bride & Groom",
    brideGroomGreeting: process.env.NEXT_PUBLIC_BRIDE_GROOM_GREETING || "Assalamu`alaikum Warahmatullaahi Wabarakaatuh",
    brideGroomText: process.env.NEXT_PUBLIC_BRIDE_GROOM_TEXT || "Maha Suci Allah yang telah menciptakan makhluk-Nya berpasang-pasangan. Ya Allah semoga ridho-Mu tercurah mengiringi pernikahan kami",
    bibleVerse: process.env.NEXT_PUBLIC_BIBLE_VERSE || "Default Bible Verse",
    bibleVerseContent: process.env.NEXT_PUBLIC_BIBLE_VERSE_CONTENT || "Default Bible Verse Content",
    timeline_1: process.env.NEXT_PUBLIC_YEAR_1 || "Default Timeline 1",
    timeline_1_content: process.env.NEXT_PUBLIC_YEAR_1_CONTENT || "Default Timeline 1 Content",
    timeline_2: process.env.NEXT_PUBLIC_YEAR_2 || "Default Timeline 2",
    timeline_2_content: process.env.NEXT_PUBLIC_YEAR_2_CONTENT || "Default Timeline 2 Content",
    timeline_3: process.env.NEXT_PUBLIC_YEAR_3 || "Default Timeline 3",
    timeline_3_content: process.env.NEXT_PUBLIC_YEAR_3_CONTENT || "Default Timeline 3 Content",
    timeline_4: process.env.NEXT_PUBLIC_YEAR_4 || "Default Timeline 4",
    timeline_4_content: process.env.NEXT_PUBLIC_YEAR_4_CONTENT || "Default Timeline 4 Content",
    backgroundMusicUrl: process.env.NEXT_PUBLIC_BACKGROUND_MUSIC_URL || "",
    holyMatrimony: {
        enabled: process.env.NEXT_PUBLIC_HOLY_MATRIMONY === 'true',
        time: process.env.NEXT_PUBLIC_HOLY_MATRIMONY_TIME || "00:00",
        place: process.env.NEXT_PUBLIC_HOLY_MATRIMONY_PLACE || "Default Church",
        place_details: process.env.NEXT_PUBLIC_HOLY_MATRIMONY_PLACE_DETAILS || "Default Street",
        googleMapsLink: process.env.NEXT_PUBLIC_HOLY_MATRIMONY_GOOGLE_MAPS || "https://maps.app.goo.gl/vPmfWux29qYYfkJTA",
    },
    weddingReception: {
        enabled: process.env.NEXT_PUBLIC_WEDDING_RECEPTION === 'true',
        time: process.env.NEXT_PUBLIC_WEDDING_RECEPTION_TIME || "00:00",
        place: process.env.NEXT_PUBLIC_WEDDING_RECEPTION_PLACE || "Default Venue",
        place_details: process.env.NEXT_PUBLIC_WEDDING_RECEPTION_PLACE_DETAILS || "Default Street",
        googleMapsLink: process.env.NEXT_PUBLIC_WEDDING_RECEPTION_GOOGLE_MAPS || "https://maps.app.goo.gl/fQGiC37iEx6fcuNq8",
    },
    livestreaming: {
        enabled: process.env.NEXT_PUBLIC_LIVE_STREAMING === 'true',
        time: process.env.NEXT_PUBLIC_LIVE_STREAMING_TIME || "00:00",
        link: process.env.NEXT_PUBLIC_LIVE_STREAMING_LINK || "#",
        detail: process.env.NEXT_PUBLIC_LIVE_STREAMING_DETAIL || "Default Livestreaming Detail",
    },
    prewedding: {
        enabled: process.env.NEXT_PUBLIC_PREWEDDING === 'true',
        link: process.env.NEXT_PUBLIC_PREWEDDING_CODE_LINK_EMBED || "#",
        detail: process.env.NEXT_PUBLIC_PREWEDDING_DETAIL || "Default Prewedding Detail",
    },
    gallery: {
        enabled: true,
        photos: [] as { src: string, alt: string }[]
    },
    gifts: {
        enabled: true,
        accounts: [] as { bank: string, number: string, owner: string }[]
    },
    rsvp: {
        enabled: process.env.NEXT_PUBLIC_RSVP === 'true',
        detail: process.env.NEXT_PUBLIC_RSVP_DETAIL || "Default RSVP Detail",
    },
    thankyou: process.env.NEXT_PUBLIC_THANKYOU || "Default Thank You",
    thankyouDetail: process.env.NEXT_PUBLIC_THANKYOU_DETAIL || "Default Thank You Detail",
    backgrounds: {
        bg_sidebar: "/foto_1_samping.jpg",
        bg_welcome: "/foto_2.jpg",
        bg_bride_groom: "/foto_1_samping.jpg",
        slide_1: "/slide_1.jpg",
        slide_2: "/slide_2.jpg",
        slide_3: "/slide_3.jpg",
        slide_4: "/slide_4.jpg",
        slide_5: "/slide_5.jpg",
        slide_6: "/slide_6.jpg",
        slide_7: "/foto_1_samping.jpg",
        slide_8: "/slide_8.jpg",
        slide_9: "/slide_9.jpg",
        slide_10: "/slide_9.jpg",
        bg_gifts: "/slide_8.jpg",
    }
};

export type WeddingConfig = typeof defaultConfig;

export async function fetchConfig(): Promise<WeddingConfig> {
  try {
    const { data, error } = await supabase
      .from('wedding_cms_settings')
      .select('content')
      .eq('id', 'default')
      .maybeSingle();

    if (error) {
      console.error('Error fetching config from Supabase:', error);
      return defaultConfig;
    }

    if (data && data.content) {
      // Merge retrieved config with default to ensure no missing fields
      return {
        ...defaultConfig,
        ...data.content,
        backgrounds: {
          ...defaultConfig.backgrounds,
          ...(data.content.backgrounds || {})
        },
        gallery: {
          ...defaultConfig.gallery,
          ...(data.content.gallery || {})
        },
        gifts: {
          ...defaultConfig.gifts,
          ...(data.content.gifts || {})
        },
        holyMatrimony: {
          ...defaultConfig.holyMatrimony,
          ...(data.content.holyMatrimony || {})
        },
        weddingReception: {
          ...defaultConfig.weddingReception,
          ...(data.content.weddingReception || {})
        },
        livestreaming: {
          ...defaultConfig.livestreaming,
          ...(data.content.livestreaming || {})
        },
      };
    }
  } catch (err) {
    console.error('Failed to fetch config:', err);
  }

  return defaultConfig;
}
