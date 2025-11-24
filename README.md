# AI-ST Debugger

AIを活用したST（Structured Text）プログラム用デバッガ - Mitsubishi GX Works連携対応

## 概要

AI-ST Debuggerは、PLCプログラマー向けの高度なデバッグ支援ツールです。IEC 61131-3準拠のStructured Text（ST）コードの解析、AIによるバグ検出、パフォーマンス最適化、実行時データモニタリングなどを提供します。

## 🚀 主な機能

### 🔍 コード解析
- **ST言語パーサー**: 完全なAST（抽象構文木）生成
- **依存関係分析**: POU間の呼び出し関係を可視化
- **変数追跡**: グローバル変数とローカル変数の使用状況を監視

### 🤖 AI分析
- **バグ検出**: GPT-4を活用した高度なコード品質分析
- **修正提案**: 具体的なコード修正と最適化案の提示
- **チャットインターフェース**: コードに関する質問にAIがリアルタイム回答

### 📊 実行時モニタリング
- **リアルタイムデータ変化**: CSV形式の実行ログをインポート
- **変数トレンド**: 時系列データのダッシュボード表示
- **エラー相関**: 実行時エラーとコードの関連付け

### 📁 プロジェクト管理
- **ファイルインポート**: .st, .prg, .fnc, .fb, .txt形式に対応
- **プロジェクト管理**: 複数プロジェクトの管理と切り替え
- **依存関係グラフ**: @xyflow/reactを活用した対話的なビジュアライゼーション

### 🛠️ コードエディタ
- **Monaco Editor**: VS Codeと同等の編集機能
- **構文ハイライト**: ST言語専用のカラーリング
- **リアルタイム分析**: 編集中のコードを常時監視

## 技術スタック

### バックエンド
- **Node.js + TypeScript**: 主要実行環境
- **Express.js**: Web APIフレームワーク
- **SQLite**: 軽量データベース（PostgreSQLも対応）
- **OpenAI API**: AI分析エンジン

### フロントエンド
- **React 18 + TypeScript**: モダンUIフレームワーク
- **Vite**: 高速ビルドツール
- **Monaco Editor**: 高機能コードエディタ
- **@xyflow/react**: 依存関係グラフ描画
- **Tailwind CSS**: ユーティリティファーストCSSフレームワーク
- **React Query**: データ取得と状態管理
- **React Router**: クライアントサイドルーティング

## 📋 動作要件

- Node.js 18.0.0以上
- npm 8.0.0以上
- OpenAI APIキー（AI分析機能使用時）

## 🛠️ インストールとセットアップ

### 1. リポジトリをクローン
```bash
git clone https://github.com/iceplantengineering/st-debugger.git
cd st-debugger
```

### 2. 依存関係をインストール
```bash
npm install
```

### 3. 環境変数を設定
```bash
cp .env.example .env
```

.envファイルに以下を設定：
- `OPENAI_API_KEY`: OpenAI APIキー（AI分析機能使用時）
- `DEMO_MODE`: デモモードを有効にする（true/false）
- `PORT`: サーバーポート（デフォルト: 3001）

### 4. 開発サーバーを起動
```bash
# 両方のサーバーを同時に起動
npm run dev

# 個別に起動
npm run dev:server  # バックエンド（ポート3001）
npm run dev:client  # フロントエンド（ポート5173）
```

### 5. アクセス
- フロントエンド: http://localhost:5173
- バックエンドAPI: http://localhost:3001

## 📁 プロジェクト構造

```
st-debugger/
├── src/
│   ├── server/              # バックエンド Node.jsアプリケーション
│   │   ├── controllers/     # APIルートコントローラー
│   │   ├── services/        # ビジネスロジックサービス
│   │   ├── models/          # データベースモデル
│   │   ├── routes/          # APIルート定義
│   │   ├── middleware/      # Expressミドルウェア
│   │   └── utils/           # ユーティリティ関数
│   ├── client/              # Reactフロントエンド
│   │   └── src/
│   │       ├── components/  # Reactコンポーネント
│   │       ├── pages/       # ページコンポーネント
│   │       ├── lib/         # ユーティリティとAPIクライアント
│   │       └── types/       # TypeScript型定義
│   └── shared/              # 共有コードと型定義
├── data/                    # SQLiteデータベースファイル
├── uploads/                 # ファイルアップロードディレクトリ
├── logs/                    # アプリケーションログ
└── public/                  # 静的ファイル
```

## 🔧 APIエンドポイント

### プロジェクト管理
- `GET /api/projects` - プロジェクト一覧
- `POST /api/projects` - 新規プロジェクト作成
- `GET /api/projects/:id` - プロジェクト詳細
- `PUT /api/projects/:id` - プロジェクト更新
- `DELETE /api/projects/:id` - プロジェクト削除

### ファイル管理
- `POST /api/projects/:id/files` - ファイルアップロード
- `GET /api/projects/:id/files` - ファイル一覧
- `PUT /api/files/:id` - ファイル更新
- `DELETE /api/files/:id` - ファイル削除

### AI分析
- `POST /api/analysis` - コード分析
- `POST /api/chat` - AIチャット
- `GET /api/projects/:id/analysis` - 分析結果

### インポート/エクスポート
- `POST /api/import/project` - プロジェクトファイルインポート
- `POST /api/import/variables` - 変数スナップショットインポート
- `POST /api/import/traces` - トレースログインポート
- `POST /api/import/errors` - エラーログインポート
- `GET /api/export/projects/:id` - プロジェクトZIPエクスポート

## 📊 対応ファイル形式

### ソースコード
- `.st` - Structured Textファイル
- `.prg` - プログラムファイル
- `.fnc` - 関数ファイル
- `.fb` - ファンクションブロックファイル
- `.txt` - テキスト形式ソースファイル

### 実行時データ
- `.csv` - 変数スナップショット
- `.csv` - トレースログ
- `.csv` - エラーログ

## 🎯 使用方法

### 1. プロジェクト作成
1. ダッシュボードで「新規プロジェクト」をクリック
2. プロジェクト名と説明を入力
3. STコードファイルをアップロード

### 2. コード編集
- Monaco EditorでSTコードを編集
- リアルタイムで構文チェック
- 変数や関数の自動補完

### 3. AI分析
- 「Run Analysis」をクリックしてコード品質を分析
- AI分析パネルで問題点と修正案を確認
- AIチャットでコードに関する質問

### 4. 実行時データ分析
- CSV形式の実行ログをアップロード
- 変数の変化トレンドをダッシュボードで確認
- エラーログとコードを関連付けて分析

### 5. 依存関係の確認
- Dependency GraphタブでPOU間の関係を視覚化
- クリックして詳細情報を表示
- 問題箇所を特定して修正

## 🤖 AI分析機能

### コード品質分析
- 構文エラー検出
- 論理エラー特定
- パフォーマンスボトルネック検出
- 安全性懸念の分析
- コードスタイル違反チェック

### 自動修正提案
- 安全インターロック改善
- エラーハンドリング強化
- パフォーマンス最適化
- 変数初期化修正
- ループ条件修正

### PLCセキュリティ機能
- 緊急停止検知：Eストップロジックの欠落を自動検出
- 温度監視：安全でない温度条件を特定
- 圧力安全：圧力リミット実装を検証
- 速度制限：適切な速度制御を確認
- インターロック検証：安全インターロック実装を検証

## 🧪 テスト

```bash
# 全テストを実行
npm test

# ウォッチモードでテスト
npm run test:watch

# カバレッジ付きテスト
npm run test:coverage
```

## 📈 開発状況

### ✅ 完了済み機能
- [x] **バックエンド実装**: 完全なNode.js/Express/TypeScriptバックエンド
- [x] **STパーサー**: 完全なStructured Text言語パーサーとAST生成
- [x] **AI分析**: OpenAI GPT-4連携のコード分析と修正提案
- [x] **Reactフロントエンド**: 完全なTypeScript/React/Viteフロントエンド
- [x] **Monaco Editor**: ST言語対応の高機能コードエディタ
- [x] **依存関係グラフ**: @xyflow/reactを使用した対話的可視化
- [x] **実行時モニター**: リアルタイム変数監視ダッシュボード
- [x] **ファイルアップロード**: マルチ形式ファイルインポートと検証
- [x] **AIチャット**: コード分析用対話AIアシスタント
- [x] **ダッシュボード**: プロジェクト管理と概要インターフェース

### 🚧 開発中
- [ ] **バージョン管理**: Gitのようなバージョニングと差分可視化
- [ ] **エクスポート機能**: 複数フォーマットでのエクスポート対応

### 📋 予定機能
- [ ] リアルタイム共同編集
- [ ] カスタム安全ルール設定
- [ ] 主要PLCプラットフォーム連携
- [ ] 高度な分析ダッシュボード
- [ ] 複数PLC IDEフォーマットエクスポート
- [ ] パフォーマンスプロファイリングツール
- [ ] 自動テストフレームワーク

## 🔧 ビルドとデプロイ

```bash
# 開発用ビルド
npm run build:dev

# 本番用ビルド
npm run build

# 本番サーバー起動
npm start
```

## 🔒 環境変数

- `PORT`: サーバーポート（デフォルト: 3001）
- `NODE_ENV`: 環境（development/production）
- `OPENAI_API_KEY`: AIサービス用OpenAI APIキー
- `DEMO_MODE`: モック応答のデモモードを有効化（true/false）
- `DB_PATH`: SQLiteデータベースファイルパス
- `LOG_LEVEL`: ログレベル（error/warn/info/debug）

## 🤝 貢献

バグ報告、機能リクエスト、コード貢献を歓迎します。

1. リポジトリをFork
2. 機能ブランチを作成（`git checkout -b feature/amazing-feature`）
3. 変更をコミット（`git commit -m 'Add amazing feature'`）
4. ブランチにプッシュ（`git push origin feature/amazing-feature`）
5. Pull Requestを作成

## 📄 ライセンス

このプロジェクトはMITライセンスの下でライセンスされています。詳細は[LICENSE](LICENSE)ファイルを参照してください。

## 🆘 サポート

サポートと質問については：
- リポジトリでIssueを作成
- `/docs`フォルダのドキュメントを確認
- http://localhost:3001でAPIドキュメントを確認

## 🙏 謝辞

- Structured Text (IEC 61131-3) 標準に基づいて構築
- OpenAI GPTモデルによるAI機能
- 産業オートメーションのベストプラクティスにインスパイア
- PLCプログラマーとオートメーションエンジニアのために作成

---

**Mitsubishi GX Works** は三菱電機株式会社の商標です。このツールは公式製品ではありません。