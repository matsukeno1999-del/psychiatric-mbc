# 精神科 MBC 管理システム

Measurement-Based Care（MBC）に基づく精神科治療効果の可視化システムです。PHQ-9・MADRS・HAM-D・BDI-II の評価尺度を記録し、経時グラフで治療効果を追跡します。

## 機能

- 患者の匿名管理（匿名コードによる識別）
- 4 種類の評価尺度入力（PHQ-9 / MADRS / HAM-D / BDI-II）
- 経時グラフによるスコア推移の可視化
- 重症度の自動判定とバッジ表示
- 期間フィルター（1 ヶ月 / 3 ヶ月 / 全期間）

## Supabase セットアップ

### 1. プロジェクト作成

[https://supabase.com](https://supabase.com) でプロジェクトを作成します。

### 2. テーブル作成

Supabase ダッシュボードの **SQL Editor** で以下を実行します。

```sql
create table patients (
  id uuid default gen_random_uuid() primary key,
  anonymous_code text not null unique,
  diagnosis text,
  notes text,
  created_at timestamp with time zone default now()
);

create table assessments (
  id uuid default gen_random_uuid() primary key,
  patient_id uuid references patients(id) on delete cascade,
  scale_name text not null,
  scores jsonb not null,
  total_score integer not null,
  assessed_at date not null,
  notes text,
  created_at timestamp with time zone default now()
);
```

### 3. RLS（Row Level Security）の設定（任意）

開発中はテーブルの RLS を無効にするか、適切なポリシーを設定してください。

Supabase ダッシュボード → Authentication → Policies から設定できます。

## 環境変数の設定

`.env.local` ファイルを編集し、Supabase の接続情報を設定します。

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Supabase ダッシュボードの **Project Settings → API** から取得できます。

## 起動方法

```bash
# 依存パッケージのインストール（初回のみ）
npm install

# 開発サーバーの起動
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

## 技術スタック

- **フレームワーク**: Next.js 16 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS v4
- **UI コンポーネント**: shadcn/ui (base-nova スタイル / Base UI)
- **データベース**: Supabase (PostgreSQL)
- **グラフ**: Recharts
