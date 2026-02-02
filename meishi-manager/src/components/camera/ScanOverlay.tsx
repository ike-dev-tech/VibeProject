/**
 * スキャンガイド枠コンポーネント
 * 名刺をスキャンする際のガイド枠を表示
 */
export function ScanOverlay() {
  return (
    <div
      data-testid="scan-overlay"
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
    >
      {/* ガイド枠 */}
      <div className="relative w-11/12 max-w-md aspect-[1.6/1] border-4 border-white rounded-lg shadow-lg">
        {/* 四隅のマーカー */}
        <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-blue-500"></div>
        <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-blue-500"></div>
        <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-blue-500"></div>
        <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-blue-500"></div>

        {/* ガイドテキスト */}
        <div className="absolute -bottom-12 left-0 right-0 text-center">
          <p className="text-white text-sm font-semibold bg-black bg-opacity-50 py-2 px-4 rounded">
            名刺を枠内に合わせてください
          </p>
        </div>
      </div>
    </div>
  );
}
