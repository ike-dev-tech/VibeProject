import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCamera } from './useCamera';

describe('useCamera', () => {
  let mockStream: MediaStream;
  let mockGetUserMedia: ReturnType<typeof vi.fn>;
  let mockTrack: MediaStreamTrack;

  beforeEach(() => {
    // MediaStreamTrack のモック
    mockTrack = {
      stop: vi.fn(),
      kind: 'video',
      enabled: true,
      id: 'mock-track-id',
      label: 'mock-camera',
      muted: false,
      readyState: 'live',
    } as unknown as MediaStreamTrack;

    // MediaStream のモック
    mockStream = {
      getTracks: vi.fn(() => [mockTrack]),
      getVideoTracks: vi.fn(() => [mockTrack]),
      getAudioTracks: vi.fn(() => []),
      id: 'mock-stream-id',
      active: true,
      addTrack: vi.fn(),
      removeTrack: vi.fn(),
      clone: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as unknown as MediaStream;

    // getUserMedia のモック
    mockGetUserMedia = vi.fn().mockResolvedValue(mockStream);
    Object.defineProperty(global.navigator, 'mediaDevices', {
      writable: true,
      configurable: true,
      value: {
        getUserMedia: mockGetUserMedia,
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('初期状態', () => {
    it('カメラが非アクティブで開始される', () => {
      const { result } = renderHook(() => useCamera());

      expect(result.current.status).toBe('idle');
      expect(result.current.stream).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  describe('startCamera', () => {
    it('カメラを正常に起動できる', async () => {
      const { result } = renderHook(() => useCamera());

      await act(async () => {
        await result.current.startCamera();
      });

      expect(mockGetUserMedia).toHaveBeenCalledWith({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      expect(result.current.status).toBe('active');
      expect(result.current.stream).toBe(mockStream);
      expect(result.current.error).toBeNull();
    });

    it('カメラ起動に失敗した場合、エラーステータスになる', async () => {
      const error = new Error('Camera access denied');
      mockGetUserMedia.mockRejectedValue(error);

      const { result } = renderHook(() => useCamera());

      await act(async () => {
        await result.current.startCamera();
      });

      expect(result.current.status).toBe('error');
      expect(result.current.stream).toBeNull();
      expect(result.current.error).toBe(error.message);
    });

    it('既にカメラが起動している場合は何もしない', async () => {
      const { result } = renderHook(() => useCamera());

      // 1回目の起動
      await act(async () => {
        await result.current.startCamera();
      });

      mockGetUserMedia.mockClear();

      // 2回目の起動試行
      await act(async () => {
        await result.current.startCamera();
      });

      // getUserMediaが再度呼ばれないことを確認
      expect(mockGetUserMedia).not.toHaveBeenCalled();
    });
  });

  describe('stopCamera', () => {
    it('カメラを正常に停止できる', async () => {
      const { result } = renderHook(() => useCamera());

      // カメラを起動
      await act(async () => {
        await result.current.startCamera();
      });

      // カメラを停止
      act(() => {
        result.current.stopCamera();
      });

      expect(mockTrack.stop).toHaveBeenCalled();
      expect(result.current.status).toBe('idle');
      expect(result.current.stream).toBeNull();
    });

    it('カメラが起動していない状態で停止を呼んでもエラーにならない', () => {
      const { result } = renderHook(() => useCamera());

      expect(() => {
        act(() => {
          result.current.stopCamera();
        });
      }).not.toThrow();
    });
  });

  describe('capture', () => {
    it('カメラが起動していない時は撮影できない', async () => {
      const { result } = renderHook(() => useCamera());

      await expect(async () => {
        await act(async () => {
          await result.current.capture();
        });
      }).rejects.toThrow('カメラが起動していません');
    });

    it('カメラが起動している時に撮影できる（Blob生成の確認）', async () => {
      const { result } = renderHook(() => useCamera());

      // Canvas のモック
      const mockToBlob = vi.fn((callback) => {
        const blob = new Blob(['fake-image'], { type: 'image/jpeg' });
        callback(blob);
      });

      const mockDrawImage = vi.fn();
      const mockGetContext = vi.fn(() => ({
        drawImage: mockDrawImage,
      }));

      const mockCanvas = {
        getContext: mockGetContext,
        toBlob: mockToBlob,
        width: 0,
        height: 0,
      };

      // Video のモック
      const mockVideo = {
        srcObject: null,
        videoWidth: 1920,
        videoHeight: 1080,
        play: vi.fn().mockResolvedValue(undefined),
        onloadedmetadata: null,
      };

      // document.createElement のモック
      const originalCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName === 'canvas') return mockCanvas as any;
        if (tagName === 'video') return mockVideo as any;
        return originalCreateElement(tagName);
      });

      // カメラを起動
      await act(async () => {
        await result.current.startCamera();
      });

      let blob: Blob | null = null;

      await act(async () => {
        // onloadedmetadataイベントをトリガー
        setTimeout(() => {
          if (mockVideo.onloadedmetadata) {
            mockVideo.onloadedmetadata(new Event('loadedmetadata'));
          }
        }, 0);

        blob = await result.current.capture();
      });

      expect(blob).toBeInstanceOf(Blob);
      expect(mockDrawImage).toHaveBeenCalled();
      expect(mockToBlob).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('アンマウント時にカメラが停止される', async () => {
      const { result, unmount } = renderHook(() => useCamera());

      // カメラを起動
      await act(async () => {
        await result.current.startCamera();
      });

      // アンマウント
      unmount();

      expect(mockTrack.stop).toHaveBeenCalled();
    });
  });
});
