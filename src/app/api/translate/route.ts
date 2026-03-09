import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const LANGUAGE_PROMPTS: Record<string, string> = {
  saudi:
    'أنت مترجم محترف. ترجم النص التالي إلى اللهجة السعودية العامية بشكل طبيعي وعفوي، مع الحفاظ على المعنى الأصلي. لا تضيف أي شرح أو مقدمة، فقط اكتب النص المترجم مباشرة.',
  egyptian:
    'أنت مترجم محترف. ترجم النص التالي إلى اللهجة المصرية العامية بشكل طبيعي وعفوي، مع الحفاظ على المعنى الأصلي. لا تضيف أي شرح أو مقدمة، فقط اكتب النص المترجم مباشرة.',
  standard:
    'أنت مترجم محترف. ترجم النص التالي إلى اللغة العربية الفصحى بشكل سلس ومفهوم، مع الحفاظ على المعنى الأصلي. لا تضيف أي شرح أو مقدمة، فقط اكتب النص المترجم مباشرة.',
  english:
    'You are a professional translator. Translate the following text into natural, fluent English. Preserve the original meaning. Do not add any explanation or introduction, just write the translated text directly.',
  french:
    'Vous êtes un traducteur professionnel. Traduisez le texte suivant en français naturel et fluide. Préservez le sens original. N\'ajoutez aucune explication ni introduction, écrivez directement le texte traduit.',
}

export async function POST(req: NextRequest) {
  try {
    const { text, language } = await req.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'النص مطلوب' }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'مفتاح OpenAI غير مضبوط. أضف OPENAI_API_KEY في ملف .env.local' },
        { status: 500 }
      )
    }

    const langKey = typeof language === 'string' && language in LANGUAGE_PROMPTS ? language : 'saudi'
    const systemPrompt = LANGUAGE_PROMPTS[langKey]

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    })

    const translated = completion.choices[0]?.message?.content?.trim()

    if (!translated) {
      return NextResponse.json({ error: 'لم يتم الحصول على ترجمة' }, { status: 500 })
    }

    return NextResponse.json({ translated })
  } catch (err: unknown) {
    console.error('translate error:', err)
    const message = err instanceof Error ? err.message : 'خطأ في الترجمة'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
