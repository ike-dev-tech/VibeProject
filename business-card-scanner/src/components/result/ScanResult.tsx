import React from 'react';
import type { BusinessCard } from '../../types/businessCard';

interface ScanResultProps {
  cards: BusinessCard[];
  onClear?: () => void;
}

/**
 * スキャン結果表示コンポーネント
 */
const ScanResult: React.FC<ScanResultProps> = ({ cards, onClear }) => {
  if (cards.length === 0) {
    return null;
  }

  return (
    <div className="scan-result-container">
      <div className="result-header">
        <h2>スキャン履歴 ({cards.length}枚)</h2>
        {onClear && (
          <button onClick={onClear} className="clear-button">
            クリア
          </button>
        )}
      </div>

      <div className="result-list">
        {cards.map((card, index) => (
          <div key={index} className="card-item">
            <div className="card-header">
              <h3>{card.name}</h3>
              {card.position && <span className="position">{card.position}</span>}
            </div>

            <div className="card-body">
              {card.company && (
                <div className="info-row">
                  <span className="label">会社:</span>
                  <span className="value">{card.company}</span>
                </div>
              )}

              {card.department && (
                <div className="info-row">
                  <span className="label">部署:</span>
                  <span className="value">{card.department}</span>
                </div>
              )}

              {card.email && (
                <div className="info-row">
                  <span className="label">メール:</span>
                  <span className="value email">
                    <a href={`mailto:${card.email}`}>{card.email}</a>
                  </span>
                </div>
              )}

              {card.phone && (
                <div className="info-row">
                  <span className="label">電話:</span>
                  <span className="value phone">
                    <a href={`tel:${card.phone}`}>{card.phone}</a>
                  </span>
                </div>
              )}

              {card.fax && (
                <div className="info-row">
                  <span className="label">FAX:</span>
                  <span className="value">{card.fax}</span>
                </div>
              )}

              {card.postalCode && (
                <div className="info-row">
                  <span className="label">郵便番号:</span>
                  <span className="value">{card.postalCode}</span>
                </div>
              )}

              {card.address && (
                <div className="info-row">
                  <span className="label">住所:</span>
                  <span className="value">{card.address}</span>
                </div>
              )}

              {card.url && (
                <div className="info-row">
                  <span className="label">URL:</span>
                  <span className="value url">
                    <a href={card.url} target="_blank" rel="noopener noreferrer">
                      {card.url}
                    </a>
                  </span>
                </div>
              )}

              {card.sns && (
                <div className="info-row">
                  <span className="label">SNS:</span>
                  <span className="value">{card.sns}</span>
                </div>
              )}
            </div>

            <div className="card-footer">
              <span className="timestamp">
                {new Date(card.scannedAt).toLocaleString('ja-JP')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScanResult;
