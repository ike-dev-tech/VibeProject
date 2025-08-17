# 設計書

## 概要

React + TypeScriptを使用したシングルページアプリケーション（SPA）として実装します。状態管理にはReactの組み込みhooksを使用し、ローカルストレージでデータを永続化します。モダンなCSS（CSS Modules または styled-components）を使用してスタイリングを行います。

## アーキテクチャ

### 技術スタック
- **フロントエンド**: React 18 + TypeScript
- **状態管理**: React hooks (useState, useEffect, useReducer)
- **データ永続化**: localStorage
- **スタイリング**: CSS Modules
- **ビルドツール**: Vite
- **テスト**: Jest + React Testing Library

### アプリケーション構造
```
src/
├── components/
│   ├── TodoApp.tsx          # メインアプリケーションコンポーネント
│   ├── TodoInput.tsx        # タスク入力コンポーネント
│   ├── TodoList.tsx         # タスクリストコンポーネント
│   ├── TodoItem.tsx         # 個別タスクコンポーネント
│   ├── TodoStats.tsx        # 統計表示コンポーネント
│   └── TodoFilter.tsx       # フィルターコンポーネント
├── hooks/
│   └── useTodos.tsx         # Todo管理カスタムhook
├── types/
│   └── todo.ts              # 型定義
├── utils/
│   └── storage.ts           # ローカルストレージユーティリティ
└── styles/
    └── *.module.css         # CSSモジュール
```

## コンポーネントとインターフェース

### データモデル

```typescript
interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

type FilterType = 'all' | 'active' | 'completed';

interface TodoState {
  todos: Todo[];
  filter: FilterType;
}
```

### コンポーネント設計

#### TodoApp (メインコンポーネント)
- **責務**: アプリケーション全体の状態管理とレイアウト
- **Props**: なし
- **State**: TodoState
- **子コンポーネント**: TodoInput, TodoStats, TodoFilter, TodoList

#### TodoInput
- **責務**: 新しいタスクの入力と追加
- **Props**: `onAddTodo: (text: string) => void`
- **State**: 入力値の管理
- **機能**: バリデーション、エンターキー対応

#### TodoList
- **責務**: フィルタリングされたタスクリストの表示
- **Props**: `todos: Todo[]`, `onToggle: (id: string) => void`, `onDelete: (id: string) => void`, `onEdit: (id: string, text: string) => void`

#### TodoItem
- **責務**: 個別タスクの表示と操作
- **Props**: `todo: Todo`, `onToggle: () => void`, `onDelete: () => void`, `onEdit: (text: string) => void`
- **State**: 編集モードの管理
- **機能**: インライン編集、キーボードイベント処理

#### TodoStats
- **責務**: タスクの統計情報表示
- **Props**: `totalCount: number`, `completedCount: number`

#### TodoFilter
- **責務**: フィルター選択UI
- **Props**: `currentFilter: FilterType`, `onFilterChange: (filter: FilterType) => void`

### カスタムHook設計

#### useTodos
```typescript
interface UseTodosReturn {
  todos: Todo[];
  filter: FilterType;
  filteredTodos: Todo[];
  totalCount: number;
  completedCount: number;
  addTodo: (text: string) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  editTodo: (id: string, text: string) => void;
  setFilter: (filter: FilterType) => void;
}
```

## データモデル

### Todo エンティティ
- **id**: 一意識別子（UUID v4）
- **text**: タスクの内容（1-500文字）
- **completed**: 完了状態（boolean）
- **createdAt**: 作成日時
- **updatedAt**: 更新日時

### ローカルストレージスキーマ
```json
{
  "todos": [
    {
      "id": "uuid",
      "text": "タスクの内容",
      "completed": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

## エラーハンドリング

### バリデーション
- **空のタスク**: 入力値が空またはスペースのみの場合はエラーメッセージを表示
- **文字数制限**: 500文字を超える場合は警告表示
- **重複チェック**: 同一テキストのタスクがある場合は確認ダイアログ

### ストレージエラー
- **localStorage無効**: セッションストレージにフォールバック
- **容量不足**: 古いデータの自動削除またはユーザーへの通知
- **データ破損**: デフォルト状態にリセット

### ユーザビリティ
- **操作フィードバック**: 操作完了時の視覚的フィードバック
- **キーボードナビゲーション**: Tab、Enter、Escapeキーの適切な処理
- **アクセシビリティ**: ARIA属性の適切な設定

## テスト戦略

### 単体テスト
- **コンポーネントテスト**: 各コンポーネントの描画と基本動作
- **Hookテスト**: useTodosの状態管理ロジック
- **ユーティリティテスト**: ストレージ操作の正常性

### 統合テスト
- **ユーザーフロー**: タスクの追加→編集→完了→削除の一連の流れ
- **フィルタリング**: 各フィルター状態での表示内容
- **永続化**: ページリロード後のデータ復元

### E2Eテスト（オプション）
- **基本操作**: 主要な機能の動作確認
- **エラーケース**: バリデーションエラーの表示確認

## パフォーマンス考慮事項

### 最適化戦略
- **React.memo**: TodoItemコンポーネントの不要な再レンダリング防止
- **useCallback**: イベントハンドラーの最適化
- **useMemo**: フィルタリング結果のメモ化
- **仮想化**: 大量のタスク（1000件以上）に対する対応

### メモリ管理
- **イベントリスナー**: 適切なクリーンアップ
- **タイマー**: 不要なsetTimeoutの回避