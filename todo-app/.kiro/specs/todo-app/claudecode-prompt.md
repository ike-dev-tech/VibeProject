# Claudecode実装プロンプト - Todoアプリ

## 概要
React + TypeScriptを使用したモダンなTodoアプリケーションを実装してください。以下の仕様に従って、段階的に実装を進めてください。

## 技術要件
- **フロントエンド**: React 18 + TypeScript
- **ビルドツール**: Vite
- **状態管理**: React hooks (useState, useEffect, useReducer)
- **データ永続化**: localStorage
- **スタイリング**: CSS Modules
- **テスト**: Jest + React Testing Library

## 機能要件

### 基本機能
1. **タスク追加**: 入力フィールドからタスクを追加（空文字バリデーション付き）
2. **完了切り替え**: チェックボックスでタスクの完了/未完了を切り替え
3. **タスク削除**: 削除ボタンでタスクを削除
4. **タスク編集**: ダブルクリックでインライン編集（Enter/Escape/フォーカスアウト対応）
5. **統計表示**: 総タスク数と完了済みタスク数を表示
6. **フィルタリング**: 「すべて」「未完了」「完了済み」でタスクを絞り込み

### データモデル
```typescript
interface Todo {
  id: string;          // UUID v4
  text: string;        // タスク内容（1-500文字）
  completed: boolean;  // 完了状態
  createdAt: Date;     // 作成日時
  updatedAt: Date;     // 更新日時
}

type FilterType = 'all' | 'active' | 'completed';
```

## アーキテクチャ設計

### ディレクトリ構造
```
src/
├── components/
│   ├── TodoApp.tsx          # メインアプリケーション
│   ├── TodoInput.tsx        # タスク入力
│   ├── TodoList.tsx         # タスクリスト
│   ├── TodoItem.tsx         # 個別タスク
│   ├── TodoStats.tsx        # 統計表示
│   └── TodoFilter.tsx       # フィルター
├── hooks/
│   └── useTodos.tsx         # Todo管理カスタムhook
├── types/
│   └── todo.ts              # 型定義
├── utils/
│   └── storage.ts           # ローカルストレージ
└── styles/
    └── *.module.css         # CSSモジュール
```

### コンポーネント設計

#### useTodos カスタムhook
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

#### 主要コンポーネントのProps
```typescript
// TodoInput
interface TodoInputProps {
  onAddTodo: (text: string) => void;
}

// TodoItem
interface TodoItemProps {
  todo: Todo;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: (text: string) => void;
}

// TodoFilter
interface TodoFilterProps {
  currentFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

// TodoStats
interface TodoStatsProps {
  totalCount: number;
  completedCount: number;
}
```

## 実装要件

### バリデーション
- 空のタスク追加を防ぐ
- 編集時の空文字を元に戻す
- 500文字制限（オプション）

### ユーザビリティ
- Enter キーでタスク追加・編集確定
- Escape キーで編集キャンセル
- ダブルクリックで編集モード
- 完了タスクに取り消し線表示
- フィルター状態の視覚的表示

### パフォーマンス最適化
- React.memo でTodoItemの不要な再レンダリング防止
- useCallback でイベントハンドラー最適化
- useMemo でフィルタリング結果メモ化

### エラーハンドリング
- localStorage エラー時の対応
- データ破損時のデフォルト状態復元

## 実装手順

1. **プロジェクトセットアップ**
   - Vite + React + TypeScript プロジェクト作成
   - 必要な依存関係インストール
   - ディレクトリ構造作成

2. **型定義とユーティリティ**
   - types/todo.ts で型定義
   - utils/storage.ts でローカルストレージ操作

3. **カスタムhook実装**
   - hooks/useTodos.tsx で状態管理ロジック
   - CRUD操作とフィルタリング機能

4. **基本コンポーネント実装**
   - TodoInput: 入力とバリデーション
   - TodoItem: 表示、編集、操作
   - TodoStats: 統計表示
   - TodoFilter: フィルター選択

5. **統合とスタイリング**
   - TodoApp でコンポーネント統合
   - CSS Modules でスタイリング

6. **テスト実装**
   - 各コンポーネントの単体テスト
   - 統合テスト

## スタイリング要件

### デザイン方針
- シンプルで使いやすいUI
- レスポンシブデザイン
- アクセシビリティ配慮
- モダンな見た目

### 主要スタイル
- 完了タスクに `text-decoration: line-through`
- アクティブフィルターのハイライト
- ホバー効果とフォーカス表示
- 適切な余白とタイポグラフィ

## テスト要件

### 単体テスト
- 各コンポーネントの描画テスト
- useTodos hook の状態管理テスト
- ユーティリティ関数のテスト

### 統合テスト
- タスクの追加→編集→完了→削除フロー
- フィルタリング機能
- ローカルストレージ連携

## 実装時の注意点

1. **段階的実装**: 一度に全機能を実装せず、基本機能から順次追加
2. **型安全性**: TypeScriptの型チェックを活用
3. **再利用性**: コンポーネントの責務を明確に分離
4. **テスト駆動**: 機能実装と並行してテスト作成
5. **パフォーマンス**: 不要な再レンダリングを避ける
6. **ユーザビリティ**: キーボード操作とアクセシビリティを考慮

## 完成イメージ
- 上部にタスク入力フィールド
- 中央にフィルタリング可能なタスクリスト
- 下部に統計情報とフィルターボタン
- 各タスクはチェックボックス、テキスト、削除ボタンを持つ
- ダブルクリックでインライン編集可能

このプロンプトに従って、モダンで使いやすいTodoアプリケーションを実装してください。