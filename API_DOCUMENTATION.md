# AI-ST Debugger API Documentation

## Overview
AI-ST Debuggerは、Structured Text (ST) プログラミング用のAI-poweredデバッグツールです。PLCプログラミングのコード分析、問題検出、修正提案を提供します。

## Base URL
```
http://localhost:3001
```

## Authentication
現在、開発モードでは認証が不要ですが、本番環境ではBearer Tokenが必要です。

### 認証ヘッダー
```
Authorization: Bearer <your-token>
```

### ユーザー情報
認証後、リクエストにユーザー情報が含まれます。

## API Endpoints

### 1. プロジェクト管理 (`/api/projects`)

#### 全プロジェクト取得
```http
GET /api/projects
```

**クエリパラメータ:**
- `page` (number, optional): ページ番号 (デフォルト: 1)
- `limit` (number, optional): 1ページあたりの件数 (デフォルト: 10)
- `search` (string, optional): 検索キーワード

**レスポンス例:**
```json
{
  "success": true,
  "data": {
    "projects": [...],
    "total": 25,
    "page": 1,
    "limit": 10
  }
}
```

#### 新規プロジェクト作成
```http
POST /api/projects
Content-Type: application/json
```

**リクエストボディ:**
```json
{
  "name": "プロジェクト名",
  "description": "プロジェクト説明",
  "files": []
}
```

**レスポンス例:**
```json
{
  "success": true,
  "data": {
    "id": "project-id",
    "name": "プロジェクト名",
    "description": "プロジェクト説明",
    "version": "1.0.0",
    "createdAt": "2025-11-26T14:30:00.000Z",
    "updatedAt": "2025-11-26T14:30:00.000Z",
    "files": []
  },
  "message": "プロジェクトを作成しました"
}
```

### 2. ファイル管理 (`/api/files`)

#### ファイルアップロード
```http
POST /api/files/upload
Content-Type: multipart/form-data
```

**リクエストボディ:**
- `file`: STファイル (.st, .prg, .fnc, .fb, .txt)

**レスポンス例:**
```json
{
  "success": true,
  "data": {
    "id": "file-id",
    "originalName": "MotorControl.prg",
    "filename": "MotorControl-123456789.st",
    "size": 1024,
    "type": ".st",
    "uploadedAt": "2025-11-26T14:30:00.000Z"
  }
}
```

#### ファイル詳細取得
```http
GET /api/files/:id
```

**レスポンス例:**
```json
{
  "success": true,
  "data": {
    "id": "file-id",
    "name": "MotorControl",
    "type": "PROGRAM",
    "content": "PROGRAM MotorControl\nVAR\n  motor: INT;\nEND_VAR\nmotor := 0;\nEND_PROGRAM",
    "ast": {...},
    "variables": [...],
    "dependencies": [...],
    "version": "1.0.0",
    "lastModified": "2025-11-26T14:30:00.000Z"
  }
}
```

### 3. AI分析 (`/api/ai`)

#### コード分析
```http
POST /api/ai/analyze
Content-Type: application/json
```

**リクエストボディ:**
```json
{
  "projectId": "project-id",
  "code": "PROGRAM Test\nVAR\n  test: INT;\nEND_VAR\ntest := 0;\nEND_PROGRAM",
  "options": {
    "includeRuntimeData": true,
    "severityLevel": ["CRITICAL", "ERROR", "WARNING", "INFO"],
    "issueTypes": ["SYNTAX_ERROR", "RUNTIME_ERROR", "SAFETY_CONCERN"],
    "includeSuggestions": true
  }
}
```

**レスポンス例:**
```json
{
  "success": true,
  "data": {
    "totalIssues": 3,
    "criticalIssues": 1,
    "warnings": 2,
    "issues": [
      {
        "id": "issue-1",
        "type": "SAFETY_CONCERN",
        "severity": "WARNING",
        "title": "安全インターロックがありません",
        "description": "モーター制御に安全インターロックが必要です",
        "pouFiles": ["MotorControl"],
        "lineNumber": 15,
        "suggestion": "緊急停止条件を追加してください",
        "confidence": 0.85
      }
    ],
    "summary": {
      "complexityScore": 45,
      "safetyScore": 70,
      "maintainabilityScore": 80
    },
    "recommendations": [
      "安全関連の問題を優先的に対応してください"
    ]
  }
}
```

### 4. インポート/エクスポート (`/api/import`, `/api/export`)

#### プロジェクトインポート
```http
POST /api/import/project
Content-Type: application/json
```

#### ファイルエクスポート
```http
POST /api/export/files
Content-Type: application/json
```

### 5. バージョン管理 (`/api/versions`)

#### バージョン作成
```http
POST /api/versions/project/:projectId
Content-Type: application/json
```

### 6. 履歴管理 (`/api/history`)

#### プロジェクト履歴取得
```http
GET /api/history/project/:projectId
```

### 7. ヘルスチェック (`/health`)

```http
GET /health
```

**レスポンス例:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-26T14:30:00.000Z",
  "version": "1.0.0",
  "port": 3001
}
```

## Error Handling

すべてのAPIエンドポイントは一貫したエラーハンドリング形式を採用しています：

```json
{
  "success": false,
  "error": "エラーメッセージ",
  "message": "詳細な説明"
}
```

## 開発モード

### 開発サーバー起動
```bash
npm run server:dev
```

### 本番サーバー起動
```bash
npm run build
npm start
```

## データベース

SQLiteを使用しており、開発環境では`./data/st-debugger.db`に保存されます。

## サポートされているファイル形式

- **STファイル**: `.st`, `.prg`, `.fnc`, `.fb`
- **テキストファイル**: `.txt`
- **CSVファイル**: `.csv`

## 制限事項

- **ファイルサイズ**: 最大50MB
- **APIリクエスト**: 1分あたり1000リクエスト
- **同時接続**: 最大100ユーザー

## セキュリティ

- **CORS**: 開発環境ではすべてのオリジンを許可
- **HTTPS**: 本番環境で推奨
- **認証**: Bearer Tokenベースの認証

## サポート

詳細な技術的サポートについては、GitHubリポジトリまたは技術ドキュメントを参照してください。

---

*最終更新: 2025-11-26*