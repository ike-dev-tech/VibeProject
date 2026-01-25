import React from 'react';
import type { ScanStatus } from '../../types/businessCard';

interface ScanOverlayProps {
  status: ScanStatus;
}

/**
 * スキャン枠オーバーレイコンポーネント
 */
const ScanOverlay: React.FC<ScanOverlayProps> = ({ status }) => {
  const getFrameClass = () => {
    switch (status) {
      case 'detecting':
        return 'scan-frame detecting';
      case 'processing':
        return 'scan-frame processing';
      case 'success':
        return 'scan-frame success';
      case 'error':
        return 'scan-frame error';
      default:
        return 'scan-frame';
    }
  };

  return (
    <div className="scan-overlay">
      {/* スキャン枠 */}
      <div className={getFrameClass()}>
        {/* 四隅のマーカー */}
        <div className="corner corner-top-left"></div>
        <div className="corner corner-top-right"></div>
        <div className="corner corner-bottom-left"></div>
        <div className="corner corner-bottom-right"></div>
      </div>
    </div>
  );
};

export default ScanOverlay;
