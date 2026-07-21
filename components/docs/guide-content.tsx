import {
  DIRECTION_WORDS,
  PIECE_NAMES,
  SHORTHAND_DIRECTION_MAP,
  SHORTHAND_PIECE_MAP,
} from "@/lib/xiangqi/notation-constants";
import type { PieceType } from "@/lib/xiangqi/board";

const PIECE_TYPES = Object.keys(PIECE_NAMES) as PieceType[];

const WORKED_EXAMPLES: { shorthand: string; full: string }[] = [
  { shorthand: "p2b5", full: "Pháo 2 bình 5" },
  { shorthand: "x9t1", full: "Xe 9 tiến 1" },
  { shorthand: "m2th3", full: "Mã 2 thoái 3" },
];

export function GuideContent() {
  return (
    <div className="flex flex-col gap-8 text-sm leading-relaxed text-ink">
      <section>
        <h2 className="mb-2 font-piece text-xl font-semibold text-wood-dark">Cách Sử Dụng</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Kỳ Luận (Bàn Cờ):</strong> chọn quân bằng cách nhấp chuột hoặc kéo-thả. Các ô có
            thể đi sẽ hiện chấm xanh ngọc; ô có quân địch có thể ăn hiện vòng tròn viền ngọc.
          </li>
          <li>
            <strong>Xuất/Nhập Kỳ Phổ:</strong> ở tab &quot;Kỳ Phổ&quot;, nhấn &quot;Tải Kỳ Phổ&quot; để tải
            biên bản ván cờ hiện tại về máy dạng <code>.txt</code>. Dán hoặc tải lên một kỳ phổ có sẵn
            để phục dựng lại toàn bộ ván đấu.
          </li>
          <li>
            <strong>Quán Cờ (Xem Lại):</strong> dùng 5 nút điều khiển — Đầu trận, Thoái nước, Tự động
            phát/Dừng, Tiến nước, Hiện tại — để duyệt qua từng nước đi. Nhấn vào một dòng trong danh
            sách kỳ phổ để nhảy thẳng đến nước đó.
          </li>
          <li>
            <strong>Rẽ Nhánh Kỳ Cục:</strong> khi đang xem lại ở một nước bất kỳ (chưa phải nước mới
            nhất), nếu bạn tự đi một quân, hệ thống sẽ âm thầm bỏ các nước phía sau và bắt đầu một
            nhánh cờ mới từ đó — không có hộp thoại xác nhận.
          </li>
          <li>
            <strong>Nhập Nhanh:</strong> gõ ký hiệu viết tắt (vd: <code>p2b5</code>) vào ô nhập nhanh
            bên dưới bàn cờ rồi nhấn Enter hoặc &quot;Đi&quot; — xem bảng tra cứu bên dưới.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="mb-2 font-piece text-xl font-semibold text-wood-dark">Quy Tắc Ghi Nước Cờ</h2>
        <p className="mb-2">
          Mỗi bên tự đếm cột 1-9 từ phải sang trái theo góc nhìn của chính mình (ngược chiều nhau
          trên màn hình). Một nước đi được ghi theo dạng{" "}
          <em>Tên Quân — Cột (hoặc trước/sau) — Hướng — Số</em>:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Tiến:</strong> quân đi về phía đối phương. Với Xe/Pháo/Binh-Tốt/Tướng đi thẳng,
            số phía sau là <em>số ô đã đi</em>; với Mã/Tượng/Sĩ (đường chéo hoặc hình chữ L), số phía
            sau là <em>cột đích</em>.
          </li>
          <li>
            <strong>Thoái:</strong> quân đi lùi về phía mình, cách tính số giống như Tiến.
          </li>
          <li>
            <strong>Bình:</strong> quân đi ngang (cùng hàng), số phía sau luôn là <em>cột đích</em>.
          </li>
          <li>
            <strong>Trước/Sau:</strong> khi hai quân cùng loại, cùng bên đứng chung một cột, ký hiệu
            thay số cột bằng &quot;trước&quot; (gần đối phương hơn) hoặc &quot;sau&quot;. Khi có 3 quân trở
            lên chung cột (thường là Binh/Tốt), thứ tự dùng &quot;trước, nhị, tam, tứ, ngũ&quot; tính từ
            quân gần đối phương nhất.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="mb-2 font-piece text-xl font-semibold text-wood-dark">
          Bảng Tra Cứu Ký Hiệu Nhập Nhanh
        </h2>
        <p className="mb-3">
          Ký hiệu gồm: <strong>Quân cờ</strong> + <strong>số cột xuất phát</strong> +{" "}
          <strong>hướng đi</strong> + <strong>số đích</strong>, viết liền không dấu cách, không phân
          biệt hoa/thường.
        </p>

        <h3 className="mb-1 font-semibold text-wood-dark">Ký hiệu quân cờ</h3>
        <div className="mb-4 overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-wood/30">
                <th className="py-1 pr-4">Quân</th>
                <th className="py-1 pr-4">Ký hiệu</th>
              </tr>
            </thead>
            <tbody>
              {PIECE_TYPES.map((type) => {
                const codes = Object.entries(SHORTHAND_PIECE_MAP)
                  .filter(([, mappedType]) => mappedType === type)
                  .map(([code]) => code);
                const entry = PIECE_NAMES[type];
                const label = typeof entry === "string" ? entry : `${entry.red} / ${entry.black}`;
                return (
                  <tr key={type} className="border-b border-wood/10">
                    <td className="py-1 pr-4">{label}</td>
                    <td className="py-1 pr-4 font-mono">{codes.join(", ")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <h3 className="mb-1 font-semibold text-wood-dark">Ký hiệu hướng đi</h3>
        <div className="mb-4 overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-wood/30">
                <th className="py-1 pr-4">Hướng</th>
                <th className="py-1 pr-4">Ký hiệu</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(SHORTHAND_DIRECTION_MAP).map(([code, direction]) => (
                <tr key={code} className="border-b border-wood/10">
                  <td className="py-1 pr-4 capitalize">{DIRECTION_WORDS[direction]}</td>
                  <td className="py-1 pr-4 font-mono">{code}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="mb-1 font-semibold text-wood-dark">Ví dụ</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-wood/30">
                <th className="py-1 pr-4">Gõ vào</th>
                <th className="py-1 pr-4">Hiển thị thành</th>
              </tr>
            </thead>
            <tbody>
              {WORKED_EXAMPLES.map((example) => (
                <tr key={example.shorthand} className="border-b border-wood/10">
                  <td className="py-1 pr-4 font-mono">{example.shorthand}</td>
                  <td className="py-1 pr-4">{example.full}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
