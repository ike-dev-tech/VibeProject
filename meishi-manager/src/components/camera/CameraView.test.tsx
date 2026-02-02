import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { CameraView } from './CameraView';
import * as useCameraModule from '../../hooks/useCamera';

// useCamera フックのモック
vi.mock('../../hooks/useCamera');

describe('CameraView', () => {
  let mockUseCamera: ReturnType<typeof vi.fn>;
  let mockStartCamera: ReturnType<typeof vi.fn>;
  let mockStopCamera: ReturnType<typeof vi.fn>;
  let mockCapture: ReturnType<typeof vi.fn>;
  let mockStream: MediaStream;

  beforeEach(() => {
    mockStartCamera = vi.fn();
    mockStopCamera = vi.fn();
    mockCapture = vi.fn();

    // より完全なMediaStreamモック
    mockStream = {
      getTracks: vi.fn(() => []),
      getVideoTracks: vi.fn(() => []),
      getAudioTracks: vi.fn(() => []),
      id: 'mock-stream',
      active: true,
      addTrack: vi.fn(),
      removeTrack: vi.fn(),
      clone: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as unknown as MediaStream;

    // HTMLVideoElement.prototype.srcObjectをモック
    // 各video要素ごとにsrcObjectを管理するためWeakMapを使用
    const srcObjectMap = new WeakMap<HTMLVideoElement, MediaStream | null>();

    Object.defineProperty(HTMLVideoElement.prototype, 'srcObject', {
      set: function (value) {
        srcObjectMap.set(this, value);
      },
      get: function () {
        return srcObjectMap.get(this) || null;
      },
      configurable: true,
    });

    mockUseCamera = vi.fn(() => ({
      stream: null,
      status: 'idle',
      error: null,
      startCamera: mockStartCamera,
      stopCamera: mockStopCamera,
      capture: mockCapture,
    }));

    vi.spyOn(useCameraModule, 'useCamera').mockImplementation(mockUseCamera);
  });

  describe('初期レンダリング', () => {
    it('カメラビューが正しくレンダリングされる', () => {
      render(<CameraView />);

      // カメラプレビュー領域が存在する
      expect(screen.getByTestId('camera-preview')).toBeInTheDocument();
    });

    it('マウント時にカメラが自動的に起動される', async () => {
      render(<CameraView />);

      await waitFor(() => {
        expect(mockStartCamera).toHaveBeenCalled();
      });
    });

    it('アンマウント時にカメラが停止される', () => {
      const { unmount } = render(<CameraView />);

      unmount();

      expect(mockStopCamera).toHaveBeenCalled();
    });
  });

  describe('カメラストリームの表示', () => {
    it('ストリームがnullの場合、video要素にストリームが設定されない', () => {
      mockUseCamera.mockReturnValue({
        stream: null,
        status: 'idle',
        error: null,
        startCamera: mockStartCamera,
        stopCamera: mockStopCamera,
        capture: mockCapture,
      });

      render(<CameraView />);

      const video = screen.getByTestId('camera-video') as HTMLVideoElement;
      expect(video.srcObject).toBeNull();
    });

    it('ストリームがある場合、video要素にストリームが設定される', async () => {
      mockUseCamera.mockReturnValue({
        stream: mockStream,
        status: 'active',
        error: null,
        startCamera: mockStartCamera,
        stopCamera: mockStopCamera,
        capture: mockCapture,
      });

      render(<CameraView />);

      await waitFor(() => {
        const video = screen.getByTestId('camera-video') as HTMLVideoElement;
        expect(video.srcObject).toBe(mockStream);
      });
    });

    it('ストリームが設定されたらvideo.play()が呼ばれる', async () => {
      const mockPlay = vi.fn().mockResolvedValue(undefined);

      // video要素のplayメソッドをモック
      HTMLVideoElement.prototype.play = mockPlay;

      mockUseCamera.mockReturnValue({
        stream: mockStream,
        status: 'active',
        error: null,
        startCamera: mockStartCamera,
        stopCamera: mockStopCamera,
        capture: mockCapture,
      });

      render(<CameraView />);

      await waitFor(() => {
        expect(mockPlay).toHaveBeenCalled();
      });
    });
  });

  describe('ステータス表示', () => {
    it('statusが"capturing"の場合、ローディング表示される', () => {
      mockUseCamera.mockReturnValue({
        stream: null,
        status: 'capturing',
        error: null,
        startCamera: mockStartCamera,
        stopCamera: mockStopCamera,
        capture: mockCapture,
      });

      render(<CameraView />);

      expect(screen.getByText(/カメラを起動中/i)).toBeInTheDocument();
    });

    it('status が "error" の場合、エラーメッセージが表示される', () => {
      mockUseCamera.mockReturnValue({
        stream: null,
        status: 'error',
        error: 'カメラへのアクセスが拒否されました',
        startCamera: mockStartCamera,
        stopCamera: mockStopCamera,
        capture: mockCapture,
      });

      render(<CameraView />);

      expect(screen.getByText(/カメラへのアクセスが拒否されました/i)).toBeInTheDocument();
    });

    it('エラー表示には再試行ボタンが表示される', () => {
      mockUseCamera.mockReturnValue({
        stream: null,
        status: 'error',
        error: 'エラーが発生しました',
        startCamera: mockStartCamera,
        stopCamera: mockStopCamera,
        capture: mockCapture,
      });

      render(<CameraView />);

      const retryButton = screen.getByRole('button', { name: /再試行/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('再試行ボタンをクリックするとstartCamera関数が呼ばれる', async () => {
      mockUseCamera.mockReturnValue({
        stream: null,
        status: 'error',
        error: 'カメラエラー',
        startCamera: mockStartCamera,
        stopCamera: mockStopCamera,
        capture: mockCapture,
      });

      render(<CameraView />);

      const retryButton = screen.getByRole('button', { name: /再試行/i });
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(mockStartCamera).toHaveBeenCalledTimes(2); // マウント時に1回 + クリックで1回
      });
    });
  });

  describe('UI要素', () => {
    it('スキャンガイド枠が表示される', () => {
      mockUseCamera.mockReturnValue({
        stream: mockStream,
        status: 'active',
        error: null,
        startCamera: mockStartCamera,
        stopCamera: mockStopCamera,
        capture: mockCapture,
      });

      render(<CameraView />);

      expect(screen.getByTestId('scan-overlay')).toBeInTheDocument();
    });

    it('撮影ボタンが表示される', () => {
      mockUseCamera.mockReturnValue({
        stream: mockStream,
        status: 'active',
        error: null,
        startCamera: mockStartCamera,
        stopCamera: mockStopCamera,
        capture: mockCapture,
      });

      render(<CameraView />);

      const captureButton = screen.getByRole('button', { name: /撮影/i });
      expect(captureButton).toBeInTheDocument();
    });

    it('カメラが起動していない時は撮影ボタンが無効', () => {
      mockUseCamera.mockReturnValue({
        stream: null,
        status: 'idle',
        error: null,
        startCamera: mockStartCamera,
        stopCamera: mockStopCamera,
        capture: mockCapture,
      });

      render(<CameraView />);

      const captureButton = screen.getByRole('button', { name: /撮影/i });
      expect(captureButton).toBeDisabled();
    });

    it('カメラが起動している時は撮影ボタンが有効', () => {
      mockUseCamera.mockReturnValue({
        stream: mockStream,
        status: 'active',
        error: null,
        startCamera: mockStartCamera,
        stopCamera: mockStopCamera,
        capture: mockCapture,
      });

      render(<CameraView />);

      const captureButton = screen.getByRole('button', { name: /撮影/i });
      expect(captureButton).toBeEnabled();
    });

    it('撮影ボタンをクリックするとcapture関数が呼ばれる', async () => {
      mockUseCamera.mockReturnValue({
        stream: mockStream,
        status: 'active',
        error: null,
        startCamera: mockStartCamera,
        stopCamera: mockStopCamera,
        capture: mockCapture,
      });

      render(<CameraView />);

      const captureButton = screen.getByRole('button', { name: /撮影/i });
      fireEvent.click(captureButton);

      await waitFor(() => {
        expect(mockCapture).toHaveBeenCalledTimes(1);
      });
    });
  });
});
