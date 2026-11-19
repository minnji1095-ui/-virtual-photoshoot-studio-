
"use client";

import { useState } from "react";

type UploadItem = {
  label: string;
  name: string;
  description: string;
};

const uploads: UploadItem[] = [
  {
    label: "Ảnh khuôn mặt",
    name: "face",
    description: "Ảnh rõ mặt, ánh sáng tốt"
  },
  {
    label: "Trang phục",
    name: "clothes",
    description: "Ảnh quần áo muốn mặc"
  },
  {
    label: "Phụ kiện",
    name: "accessories",
    description: "Túi, kính, trang sức..."
  },
  {
    label: "Phông nền",
    name: "background",
    description: "Ảnh địa điểm muốn chụp"
  },
  {
    label: "Dáng chụp",
    name: "pose",
    description: "Ảnh tham khảo tư thế (không bắt buộc)"
  }
];

export default function Home() {
  const [files, setFiles] = useState<Record<string, File | null>>({
    face: null,
    clothes: null,
    accessories: null,
    background: null,
    pose: null
  });

  const [framing, setFraming] = useState("Toàn thân");
  const [aspectRatio, setAspectRatio] = useState("3:4");
  const [style, setStyle] = useState("Ảnh chân thực tự nhiên");
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");

  function selectFile(name: string, file: File | null) {
    setFiles((old) => ({ ...old, [name]: file }));
  }

  async function generateImage() {
    if (!files.face) {
      setError("Cậu hãy tải ảnh khuôn mặt lên trước nhé.");
      return;
    }

    if (!files.clothes) {
      setError("Cậu hãy tải ảnh trang phục lên nhé.");
      return;
    }

    setLoading(true);
    setError("");
    setResult("");

    try {
      const data = new FormData();

      Object.entries(files).forEach(([key, file]) => {
        if (file) data.append(key, file);
      });

      data.append("framing", framing);
      data.append("aspectRatio", aspectRatio);
      data.append("colorStyle", style);
      data.append("instructions", instructions);

      const response = await fetch("/api/photoshoot", {
        method: "POST",
        body: data
      });

      const output = await response.json();

      if (!response.ok) {
        throw new Error(output.error || "Không thể tạo ảnh.");
      }

      setResult(output.image);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi. Cậu thử lại nhé."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="studio">
      <header className="header">
        <h1>Virtual Photoshoot Studio</h1>
        <p>
          Studio chụp ảnh ảo bằng AI – tạo bộ ảnh chân thực
          mà không cần đến studio.
        </p>
      </header>

      <section className="panel">
        <h2>01. Tải ảnh tham chiếu</h2>
        <div className="upload-grid">
          {uploads.map((item) => (
            <label className="upload-box" key={item.name}>
              <strong>{item.label}</strong>
              <span>{item.description}</span>
              <input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  selectFile(
                    item.name,
                    event.target.files?.[0] || null
                  )
                }
              />
              {files[item.name] && (
                <img
                  className="preview"
                  src={URL.createObjectURL(files[item.name]!)}
                  alt={item.label}
                />
              )}
              {files[item.name] && (
                <small>{files[item.name]!.name}</small>
              )}
            </label>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>02. Thiết lập buổi chụp</h2>

        <div className="field">
          <label>Khung hình</label>
          <select
            value={framing}
            onChange={(e) => setFraming(e.target.value)}
          >
            <option>Toàn thân</option>
            <option>Bán thân</option>
            <option>Chân dung cận mặt</option>
            <option>Ngồi tự nhiên</option>
          </select>
        </div>

        <div className="field">
          <label>Tỷ lệ ảnh</label>
          <select
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value)}
          >
            <option value="3:4">3:4 – Ảnh chân dung</option>
            <option value="2:3">2:3 – Ảnh dọc</option>
            <option value="1:1">1:1 – Ảnh vuông</option>
            <option value="4:5">4:5 – Instagram</option>
            <option value="16:9">16:9 – Ảnh ngang</option>
          </select>
        </div>

        <div className="field">
          <label>Phong cách hình ảnh</label>
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value)}
          >
            <option>Ảnh chân thực tự nhiên</option>
            <option>Korean café aesthetic</option>
            <option>Editorial thời trang</option>
            <option>Ảnh đường phố</option>
            <option>Studio chuyên nghiệp</option>
            <option>Ánh sáng điện ảnh</option>
          </select>
        </div>

        <div className="field">
          <label>Yêu cầu riêng</label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Ví dụ: Giữ nguyên khuôn mặt, tỷ lệ mắt, mũi, môi. Ánh sáng tự nhiên, da có kết cấu thật, không làm mịn quá mức..."
          />
        </div>
      </section>

      <section className="panel">
        <h2>03. Tạo ảnh AI</h2>
        <p>
          AI sẽ kết hợp khuôn mặt, trang phục, phụ kiện,
          phông nền và dáng chụp thành một bức ảnh.
        </p>

        <button
          className="generate-button"
          onClick={generateImage}
          disabled={loading}
        >
          {loading ? "Đang tạo ảnh, vui lòng chờ..." : "✦ TẠO ẢNH CỦA TÔI"}
        </button>

        {error && <p className="status">{error}</p>}
        {loading && (
          <p className="status">
            AI đang xử lý các ảnh tham chiếu của cậu...
          </p>
        )}

        {result && (
          <div>
            <h2 style={{ marginTop: 24 }}>Ảnh hoàn thành</h2>
            <img className="result" src={result} alt="Ảnh AI đã tạo" />
            <a
              href={result}
              download="virtual-photoshoot.png"
            >
              <button className="generate-button" style={{ marginTop: 15 }}>
                Tải ảnh về điện thoại
              </button>
            </a>
          </div>
        )}
      </section>

      <footer className="status">
        Virtual Photoshoot Studio · AI Image Creation
      </footer>
    </main>
  );
}
