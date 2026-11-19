
import OpenAI, { toFile } from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_FILE_SIZE = 8 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Chưa cấu hình OPENAI_API_KEY trên máy chủ." },
        { status: 500 }
      );
    }

    const form = await request.formData();

    const fields = [
      "face",
      "clothes",
      "accessories",
      "background",
      "pose"
    ];

    const images: Array<Awaited<ReturnType<typeof toFile>>> = [];

    for (const field of fields) {
      const value = form.get(field);

      if (!value || typeof value === "string") continue;

      const file = value as File;

      if (!file.type.startsWith("image/")) {
        return NextResponse.json(
          { error: `File ${field} không phải ảnh hợp lệ.` },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `Ảnh ${field} vượt quá giới hạn 8 MB.` },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());

      images.push(
        await toFile(buffer, file.name || `${field}.png`, {
          type: file.type
        })
      );
    }

    if (!form.get("face") || !form.get("clothes")) {
      return NextResponse.json(
        { error: "Cần có ảnh khuôn mặt và ảnh trang phục." },
        { status: 400 }
      );
    }

    if (images.length === 0) {
      return NextResponse.json(
        { error: "Không tìm thấy ảnh tham chiếu." },
        { status: 400 }
      );
    }

    const framing = String(form.get("framing") || "Toàn thân");
    const aspectRatio = String(form.get("aspectRatio") || "3:4");
    const colorStyle = String(
      form.get("colorStyle") || "Ảnh chân thực tự nhiên"
    );
    const instructions = String(form.get("instructions") || "");

    const prompt = `
Create one highly photorealistic fashion photoshoot image.

REFERENCE IMAGE ORDER:
1. Face: preserve the person's identity and facial characteristics.
2. Clothes: reproduce the outfit faithfully.
3. Accessories: include the provided accessories when present.
4. Background: recreate the supplied location and environment.
5. Pose: use as a pose reference when provided.

IMPORTANT:
- Keep the face as close as possible to the face reference.
- Do not intentionally beautify, reshape or change facial proportions.
- Preserve natural skin texture and realistic details.
- Reproduce the clothing and accessories accurately.
- Integrate the subject into the background with believable lighting,
  perspective, shadows and proportions.
- Avoid plastic skin, artificial facial features and obvious compositing.
- Create a natural professional photograph, not an illustration.

FRAMING: ${framing}
ASPECT RATIO REQUEST: ${aspectRatio}
VISUAL STYLE: ${colorStyle}
ADDITIONAL INSTRUCTIONS: ${instructions}
`;

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const result = await client.images.edit({
      model: "gpt-image-1",
      image: images,
      prompt,
      size: "1024x1536",
      quality: "high"
    });

    const image = result.data?.[0]?.b64_json;

    if (!image) {
      throw new Error("AI không trả về ảnh. Vui lòng thử lại.");
    }

    return NextResponse.json({
      image: `data:image/png;base64,${image}`
    });
  } catch (error) {
    console.error("Photoshoot API error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Không thể tạo ảnh lúc này."
      },
      { status: 500 }
    );
  }
}
