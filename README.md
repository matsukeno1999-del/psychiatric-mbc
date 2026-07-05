# 精神科 MBC 管理システム

Measurement-Based Care（MBC）に基づく精神科治療効果の可視化デスクトップアプリです。11 種類の評価尺度を記録し、経時グラフで治療効果を追跡します。

**完全ローカル動作**の Electron アプリで、データはすべて端末内の SQLite に保存されます。外部サーバーへの通信は行いません。

## ダウンロード（Windows）

1. [Releases ページ](https://github.com/matsukeno1999-del/psychiatric-mbc/releases/latest)から `精神科MBC管理システム Setup x.x.x.exe` をダウンロード
2. ダウンロードした exe を実行してインストール

> **「Windows によって PC が保護されました」と表示される場合**
> 本アプリはコード署名を行っていないため、初回実行時に Microsoft Defender SmartScreen の警告が表示されることがあります。「詳細情報」→「実行」の順にクリックすると起動できます。

## 免責事項

本ソフトウェアは評価尺度スコアの**記録・可視化を目的としたツール**であり、診断・治療方針の決定を行うものではありません。臨床上の判断はすべて医療者自身の責任で行ってください。本ソフトウェアの使用により生じたいかなる損害についても、開発者は責任を負いません。

患者データは利用者の端末内にのみ保存されます。患者氏名などの個人情報は入力せず、匿名コードで管理する運用を推奨します。

## 機能

- 患者の匿名管理（匿名コード・年齢・性別・診断・メモ）
- 診断別にグループ化された 11 種類の評価尺度入力
- 経時グラフによるスコア推移の可視化（重症度カットオフライン表示付き）
- 重症度の自動判定とバッジ表示
- 期間フィルター（1 ヶ月 / 3 ヶ月 / 全期間）
- CSV エクスポート（ワイド形式 — 全 11 尺度を患者 × 評価日ごとに 1 行で出力）

## 対応評価尺度

| 診断グループ | 尺度 |
|---|---|
| うつ病・気分障害 | PHQ-9 / MADRS / HAM-D / BDI-II |
| 双極性障害 | YMRS |
| 統合失調症 | PANSS / BPRS / DIEPSS |
| 不安障害 | GAD-7 / CGI |
| 不眠症 | ISI |

各尺度は項目定義・重症度区分・カットオフ値を `lib/scales.ts` で管理しています。

## データの保存場所

| 環境 | パス |
|---|---|
| 開発時 | プロジェクト内 `data/data.db` |
| インストール版 | `%APPDATA%\psychiatric-mbc\data.db`（Electron の userData ディレクトリ） |

SQLite（WAL モード・外部キー制約有効）で `patients` / `assessments` の 2 テーブル構成です。スキーマは初回起動時に自動作成されます（`electron/database.js`）。

## 開発環境での起動

```bash
# 依存パッケージのインストール（初回のみ）
npm install

# ターミナル1: Next.js 開発サーバー
npm run dev

# ターミナル2: Electron ウィンドウ（localhost:3000 を読み込む）
npm run electron:dev
```

## インストーラーのビルド

```bash
npm run electron:build
```

Next.js の静的エクスポート（`out/`）を electron-serve で読み込む構成でビルドし、`dist/精神科MBC管理システム Setup 1.0.0.exe`（Windows x64 インストーラー）を生成します。

## アーキテクチャ

```
Next.js (静的エクスポート)  ←  レンダラープロセス（UI）
        │  window.electronAPI（preload.js / contextIsolation 有効）
        ▼
Electron メインプロセス（electron/main.js）
        │  IPC ハンドラ
        ▼
better-sqlite3（electron/database.js） →  data.db
```

レンダラーは `nodeIntegration: false` / `contextIsolation: true` で分離し、DB アクセスはすべて IPC 経由でメインプロセスが行います。

## 技術スタック

- **デスクトップ**: Electron 42 + electron-builder
- **フレームワーク**: Next.js 16 (App Router / 静的エクスポート)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS v4
- **UI コンポーネント**: shadcn/ui (base-nova スタイル / Base UI)
- **データベース**: SQLite (better-sqlite3)
- **グラフ**: Recharts

## 画面構成

| パス | 画面 |
|---|---|
| `/` | ホーム（患者一覧） |
| `/patient` | 患者詳細・経時グラフ |
| `/assess` | 評価尺度の入力 |
| `/export` | CSV エクスポート |

## 補足

初期バージョンは Supabase（クラウド PostgreSQL）を使用していましたが、診療データを端末外に出さないため、現在は完全ローカルの Electron + SQLite 構成に移行済みです。

## ライセンス

[MIT License](LICENSE)
