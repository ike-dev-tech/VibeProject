interface CaptureButtonProps {
  onCapture: () => Promise<Blob>;
  disabled?: boolean;
}

/**
 * 撮影ボタンコンポーネント
 * カメラで写真を撮影するためのボタン
 */
export function CaptureButton({ onCapture, disabled = false }: CaptureButtonProps) {
  const handleCapture = async () => {
    try {
      await onCapture();
    } catch (error) {
      console.error('Capture error:', error);
    }
  };

  return (
    <button
      onClick={handleCapture}
      disabled={disabled}
      aria-label="撮影"
      className={`
        w-20 h-20 rounded-full border-4 border-white
        flex items-center justify-center
        transition-all duration-200
        ${
          disabled
            ? 'bg-gray-500 opacity-50 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-lg'
        }
      `}
    >
      <div className="w-16 h-16 rounded-full bg-white"></div>
    </button>
  );
}
