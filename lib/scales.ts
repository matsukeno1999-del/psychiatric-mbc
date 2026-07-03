import type { ScaleDefinition, ScaleGroup, ScaleName, SeverityLevel } from './types'

export const SCALE_DEFINITIONS: Record<ScaleName, ScaleDefinition> = {
  'PHQ-9': {
    name: 'PHQ-9',
    description: 'Patient Health Questionnaire-9（患者健康質問票）',
    items: [
      { id: 'phq1', label: '物事への興味・楽しみがない', maxScore: 3 },
      { id: 'phq2', label: '気分が落ち込む、憂うつになる、絶望的な気持ちになる', maxScore: 3 },
      { id: 'phq3', label: '眠れない、または眠りすぎる', maxScore: 3 },
      { id: 'phq4', label: '疲れた感じ、気力がない', maxScore: 3 },
      { id: 'phq5', label: '食欲がない、または食べすぎる', maxScore: 3 },
      { id: 'phq6', label: '自分はダメな人間だ、失敗者だという気持ち', maxScore: 3 },
      { id: 'phq7', label: '集中できない', maxScore: 3 },
      { id: 'phq8', label: '動作や話し方が遅くなる、またはそわそわして落ち着かない', maxScore: 3 },
      { id: 'phq9', label: '死んだほうがいい、または自分を傷つけたいという気持ち', maxScore: 3 },
    ],
    maxScore: 27,
    severityLevels: [
      { label: 'なし', min: 0, max: 4, color: '#22c55e' },
      { label: '軽度', min: 5, max: 9, color: '#eab308' },
      { label: '中等度', min: 10, max: 14, color: '#f97316' },
      { label: 'やや重度', min: 15, max: 19, color: '#ef4444' },
      { label: '重度', min: 20, max: 27, color: '#7f1d1d' },
    ],
    cutoffLines: [5, 10, 15, 20],
  },
  'MADRS': {
    name: 'MADRS',
    description: 'Montgomery-Åsberg Depression Rating Scale',
    items: [
      { id: 'madrs1', label: '見かけ上の悲しみ', maxScore: 6 },
      { id: 'madrs2', label: '報告された悲しみ', maxScore: 6 },
      { id: 'madrs3', label: '内的緊張', maxScore: 6 },
      { id: 'madrs4', label: '睡眠障害', maxScore: 6 },
      { id: 'madrs5', label: '食欲低下', maxScore: 6 },
      { id: 'madrs6', label: '集中困難', maxScore: 6 },
      { id: 'madrs7', label: '倦怠感', maxScore: 6 },
      { id: 'madrs8', label: '感情の欠如', maxScore: 6 },
      { id: 'madrs9', label: '悲観的思考', maxScore: 6 },
      { id: 'madrs10', label: '自殺念慮', maxScore: 6 },
    ],
    maxScore: 60,
    severityLevels: [
      { label: '正常', min: 0, max: 6, color: '#22c55e' },
      { label: '軽度', min: 7, max: 19, color: '#eab308' },
      { label: '中等度', min: 20, max: 34, color: '#f97316' },
      { label: '重度', min: 35, max: 60, color: '#ef4444' },
    ],
    cutoffLines: [7, 20, 35],
  },
  'HAM-D': {
    name: 'HAM-D',
    description: 'Hamilton Depression Rating Scale（ハミルトン抑うつ評価尺度）',
    items: [
      { id: 'hamd1', label: '抑うつ気分', maxScore: 4 },
      { id: 'hamd2', label: '罪業感', maxScore: 4 },
      { id: 'hamd3', label: '自殺念慮', maxScore: 4 },
      { id: 'hamd4', label: '早期不眠', maxScore: 2 },
      { id: 'hamd5', label: '中期不眠', maxScore: 2 },
      { id: 'hamd6', label: '後期不眠', maxScore: 2 },
      { id: 'hamd7', label: '仕事と活動', maxScore: 4 },
      { id: 'hamd8', label: '精神運動制止', maxScore: 4 },
      { id: 'hamd9', label: '精神運動興奮', maxScore: 4 },
      { id: 'hamd10', label: '精神的不安', maxScore: 4 },
      { id: 'hamd11', label: '身体的不安', maxScore: 4 },
      { id: 'hamd12', label: '消化器症状', maxScore: 2 },
      { id: 'hamd13', label: '全身症状', maxScore: 2 },
      { id: 'hamd14', label: '性的症状', maxScore: 2 },
      { id: 'hamd15', label: '心気症', maxScore: 4 },
      { id: 'hamd16', label: '体重減少', maxScore: 2 },
      { id: 'hamd17', label: '病識', maxScore: 2 },
    ],
    maxScore: 52,
    severityLevels: [
      { label: '正常', min: 0, max: 7, color: '#22c55e' },
      { label: '軽度', min: 8, max: 13, color: '#eab308' },
      { label: '中等度', min: 14, max: 18, color: '#f97316' },
      { label: '重度', min: 19, max: 22, color: '#ef4444' },
      { label: '最重度', min: 23, max: 52, color: '#7f1d1d' },
    ],
    cutoffLines: [8, 14, 19, 23],
  },
  'BDI-II': {
    name: 'BDI-II',
    description: 'Beck Depression Inventory-II（ベック抑うつ質問票）',
    items: [
      { id: 'bdi1', label: '悲しみ', maxScore: 3 },
      { id: 'bdi2', label: '悲観主義', maxScore: 3 },
      { id: 'bdi3', label: '過去の失敗', maxScore: 3 },
      { id: 'bdi4', label: '楽しみの喪失', maxScore: 3 },
      { id: 'bdi5', label: '罪悪感', maxScore: 3 },
      { id: 'bdi6', label: '罰の感覚', maxScore: 3 },
      { id: 'bdi7', label: '自己嫌悪', maxScore: 3 },
      { id: 'bdi8', label: '自己批判', maxScore: 3 },
      { id: 'bdi9', label: '自殺念慮', maxScore: 3 },
      { id: 'bdi10', label: '涙もろさ', maxScore: 3 },
      { id: 'bdi11', label: '焦り', maxScore: 3 },
      { id: 'bdi12', label: '興味の喪失', maxScore: 3 },
      { id: 'bdi13', label: '決断困難', maxScore: 3 },
      { id: 'bdi14', label: '無価値感', maxScore: 3 },
      { id: 'bdi15', label: '気力の喪失', maxScore: 3 },
      { id: 'bdi16', label: '睡眠パターンの変化', maxScore: 3 },
      { id: 'bdi17', label: '易怒性', maxScore: 3 },
      { id: 'bdi18', label: '食欲の変化', maxScore: 3 },
      { id: 'bdi19', label: '集中困難', maxScore: 3 },
      { id: 'bdi20', label: '疲れやすさ', maxScore: 3 },
      { id: 'bdi21', label: '性的関心の喪失', maxScore: 3 },
    ],
    maxScore: 63,
    severityLevels: [
      { label: '最小', min: 0, max: 13, color: '#22c55e' },
      { label: '軽度', min: 14, max: 19, color: '#eab308' },
      { label: '中等度', min: 20, max: 28, color: '#f97316' },
      { label: '重度', min: 29, max: 63, color: '#ef4444' },
    ],
    cutoffLines: [14, 20, 29],
  },
  'PANSS': {
    name: 'PANSS',
    description: 'Positive and Negative Syndrome Scale',
    items: [
      { id: 'p1', label: '[P1] 妄想', maxScore: 7, minScore: 1 },
      { id: 'p2', label: '[P2] 概念統合の解体', maxScore: 7, minScore: 1 },
      { id: 'p3', label: '[P3] 幻覚による行動', maxScore: 7, minScore: 1 },
      { id: 'p4', label: '[P4] 興奮', maxScore: 7, minScore: 1 },
      { id: 'p5', label: '[P5] 誇大性', maxScore: 7, minScore: 1 },
      { id: 'p6', label: '[P6] 猜疑心・被害念慮', maxScore: 7, minScore: 1 },
      { id: 'p7', label: '[P7] 敵意', maxScore: 7, minScore: 1 },
      { id: 'n1', label: '[N1] 情動鈍麻', maxScore: 7, minScore: 1 },
      { id: 'n2', label: '[N2] 情緒的引きこもり', maxScore: 7, minScore: 1 },
      { id: 'n3', label: '[N3] 疎通性の貧困', maxScore: 7, minScore: 1 },
      { id: 'n4', label: '[N4] 受動的・無感動的な社会的引きこもり', maxScore: 7, minScore: 1 },
      { id: 'n5', label: '[N5] 抽象的思考の困難', maxScore: 7, minScore: 1 },
      { id: 'n6', label: '[N6] 会話の自発性と流暢さの欠如', maxScore: 7, minScore: 1 },
      { id: 'n7', label: '[N7] 常同思考', maxScore: 7, minScore: 1 },
      { id: 'g1', label: '[G1] 身体的健康への心配', maxScore: 7, minScore: 1 },
      { id: 'g2', label: '[G2] 不安', maxScore: 7, minScore: 1 },
      { id: 'g3', label: '[G3] 罪悪感', maxScore: 7, minScore: 1 },
      { id: 'g4', label: '[G4] 緊張', maxScore: 7, minScore: 1 },
      { id: 'g5', label: '[G5] 衒奇症と不自然な姿勢', maxScore: 7, minScore: 1 },
      { id: 'g6', label: '[G6] 抑うつ', maxScore: 7, minScore: 1 },
      { id: 'g7', label: '[G7] 運動遅滞', maxScore: 7, minScore: 1 },
      { id: 'g8', label: '[G8] 非協調性', maxScore: 7, minScore: 1 },
      { id: 'g9', label: '[G9] 異常な思考内容', maxScore: 7, minScore: 1 },
      { id: 'g10', label: '[G10] 失見当識', maxScore: 7, minScore: 1 },
      { id: 'g11', label: '[G11] 注意の障害', maxScore: 7, minScore: 1 },
      { id: 'g12', label: '[G12] 判断力と病識の欠如', maxScore: 7, minScore: 1 },
      { id: 'g13', label: '[G13] 意志の障害', maxScore: 7, minScore: 1 },
      { id: 'g14', label: '[G14] 衝動制御の障害', maxScore: 7, minScore: 1 },
      { id: 'g15', label: '[G15] 没頭・先取り', maxScore: 7, minScore: 1 },
      { id: 'g16', label: '[G16] 能動的な社会的回避', maxScore: 7, minScore: 1 },
    ],
    maxScore: 210,
    severityLevels: [
      { label: '軽度', min: 30, max: 58, color: '#eab308' },
      { label: '中等度', min: 59, max: 75, color: '#f97316' },
      { label: 'やや重度', min: 76, max: 90, color: '#ef4444' },
      { label: '重度', min: 91, max: 210, color: '#7f1d1d' },
    ],
    cutoffLines: [59, 76, 91],
  },
  'BPRS': {
    name: 'BPRS',
    description: 'Brief Psychiatric Rating Scale（簡易精神症状評価尺度）',
    items: [
      { id: 'bprs1', label: '身体的訴え', maxScore: 7, minScore: 1 },
      { id: 'bprs2', label: '不安', maxScore: 7, minScore: 1 },
      { id: 'bprs3', label: '情動的引きこもり', maxScore: 7, minScore: 1 },
      { id: 'bprs4', label: '概念統合の解体', maxScore: 7, minScore: 1 },
      { id: 'bprs5', label: '罪悪感', maxScore: 7, minScore: 1 },
      { id: 'bprs6', label: '緊張', maxScore: 7, minScore: 1 },
      { id: 'bprs7', label: '衒奇症と姿勢', maxScore: 7, minScore: 1 },
      { id: 'bprs8', label: '誇大性', maxScore: 7, minScore: 1 },
      { id: 'bprs9', label: '抑うつ気分', maxScore: 7, minScore: 1 },
      { id: 'bprs10', label: '敵意', maxScore: 7, minScore: 1 },
      { id: 'bprs11', label: '猜疑心', maxScore: 7, minScore: 1 },
      { id: 'bprs12', label: '幻覚による行動', maxScore: 7, minScore: 1 },
      { id: 'bprs13', label: '運動遅滞', maxScore: 7, minScore: 1 },
      { id: 'bprs14', label: '非協調性', maxScore: 7, minScore: 1 },
      { id: 'bprs15', label: '異常な思考内容', maxScore: 7, minScore: 1 },
      { id: 'bprs16', label: '感情鈍麻', maxScore: 7, minScore: 1 },
      { id: 'bprs17', label: '興奮', maxScore: 7, minScore: 1 },
      { id: 'bprs18', label: '失見当識', maxScore: 7, minScore: 1 },
    ],
    maxScore: 126,
    severityLevels: [
      { label: '正常', min: 18, max: 30, color: '#22c55e' },
      { label: '軽度', min: 31, max: 40, color: '#eab308' },
      { label: '中等度', min: 41, max: 52, color: '#f97316' },
      { label: '重度', min: 53, max: 126, color: '#ef4444' },
    ],
    cutoffLines: [31, 41, 53],
  },
  'DIEPSS': {
    name: 'DIEPSS',
    description: 'Drug-Induced Extrapyramidal Symptoms Scale（薬原性錐体外路症状評価尺度）',
    items: [
      { id: 'diepss1', label: '歩行', maxScore: 4 },
      { id: 'diepss2', label: '上肢の動かし方', maxScore: 4 },
      { id: 'diepss3', label: '座位姿勢', maxScore: 4 },
      { id: 'diepss4', label: '振戦', maxScore: 4 },
      { id: 'diepss5', label: '無動・寡動', maxScore: 4 },
      { id: 'diepss6', label: '流涎', maxScore: 4 },
      { id: 'diepss7', label: '頸部固縮', maxScore: 4 },
      { id: 'diepss8', label: 'アカシジア', maxScore: 4 },
      { id: 'diepss9', label: '全般的重症度（総括）', maxScore: 4 },
    ],
    maxScore: 36,
    severityLevels: [
      { label: 'なし', min: 0, max: 2, color: '#22c55e' },
      { label: '軽度', min: 3, max: 7, color: '#eab308' },
      { label: '中等度', min: 8, max: 15, color: '#f97316' },
      { label: '重度', min: 16, max: 36, color: '#ef4444' },
    ],
    cutoffLines: [3, 8, 16],
  },
  'YMRS': {
    name: 'YMRS',
    description: 'Young Mania Rating Scale（躁症状評価尺度）',
    items: [
      { id: 'ymrs1', label: '気分の高揚', maxScore: 4 },
      { id: 'ymrs2', label: '活動性・エネルギーの増加', maxScore: 4 },
      { id: 'ymrs3', label: '性的関心', maxScore: 4 },
      { id: 'ymrs4', label: '睡眠', maxScore: 4 },
      { id: 'ymrs5', label: '易怒性', maxScore: 8 },
      { id: 'ymrs6', label: '発話（速度・量）', maxScore: 8 },
      { id: 'ymrs7', label: '言語・思考障害', maxScore: 4 },
      { id: 'ymrs8', label: '思考内容', maxScore: 8 },
      { id: 'ymrs9', label: '攻撃的・破壊的行動', maxScore: 8 },
      { id: 'ymrs10', label: '外見', maxScore: 4 },
      { id: 'ymrs11', label: '病識', maxScore: 4 },
    ],
    maxScore: 60,
    severityLevels: [
      { label: '正常/寛解', min: 0, max: 7, color: '#22c55e' },
      { label: '軽症', min: 8, max: 19, color: '#eab308' },
      { label: '中等度', min: 20, max: 28, color: '#f97316' },
      { label: '重度', min: 29, max: 60, color: '#ef4444' },
    ],
    cutoffLines: [8, 20, 29],
  },
  'CGI': {
    name: 'CGI',
    description: 'Clinical Global Impression-Severity（臨床全般印象重症度）',
    items: [
      { id: 'cgis', label: 'CGI-S: 重症度（1=正常 〜 7=最重度）', maxScore: 7, minScore: 1 },
    ],
    maxScore: 7,
    severityLevels: [
      { label: '正常〜境界的', min: 1, max: 2, color: '#22c55e' },
      { label: '軽度〜中等度', min: 3, max: 4, color: '#eab308' },
      { label: '著明〜高度', min: 5, max: 6, color: '#f97316' },
      { label: '最重度', min: 7, max: 7, color: '#ef4444' },
    ],
    cutoffLines: [3, 5, 7],
  },
  'GAD-7': {
    name: 'GAD-7',
    description: 'Generalized Anxiety Disorder-7（全般性不安障害質問票）',
    items: [
      { id: 'gad1', label: '緊張感、不安感または神経過敏を感じる', maxScore: 3 },
      { id: 'gad2', label: '心配することを止められない、または心配をコントロールできない', maxScore: 3 },
      { id: 'gad3', label: 'いろいろなことを心配しすぎる', maxScore: 3 },
      { id: 'gad4', label: 'くつろぐことが難しい', maxScore: 3 },
      { id: 'gad5', label: 'じっとしていられないほど落ち着かない', maxScore: 3 },
      { id: 'gad6', label: 'いらいらしがちであり、怒りっぽい', maxScore: 3 },
      { id: 'gad7', label: '何か恐ろしいことが起こるのではないかと恐れを感じる', maxScore: 3 },
    ],
    maxScore: 21,
    severityLevels: [
      { label: 'なし', min: 0, max: 4, color: '#22c55e' },
      { label: '軽度', min: 5, max: 9, color: '#eab308' },
      { label: '中等度', min: 10, max: 14, color: '#f97316' },
      { label: '重度', min: 15, max: 21, color: '#ef4444' },
    ],
    cutoffLines: [5, 10, 15],
  },
  'ISI': {
    name: 'ISI',
    description: 'Insomnia Severity Index（不眠重症度指数）',
    items: [
      { id: 'isi1', label: '入眠困難の重症度', maxScore: 4 },
      { id: 'isi2', label: '中途覚醒の重症度', maxScore: 4 },
      { id: 'isi3', label: '早朝覚醒の重症度', maxScore: 4 },
      { id: 'isi4', label: '睡眠パターンへの満足度（不満の程度）', maxScore: 4 },
      { id: 'isi5', label: '日中機能への支障', maxScore: 4 },
      { id: 'isi6', label: '睡眠問題に気づいている他者の心配度', maxScore: 4 },
      { id: 'isi7', label: '現在の睡眠問題に対する苦痛度', maxScore: 4 },
    ],
    maxScore: 28,
    severityLevels: [
      { label: '臨床的に問題なし', min: 0, max: 7, color: '#22c55e' },
      { label: '閾値以下の不眠', min: 8, max: 14, color: '#eab308' },
      { label: '中等度の不眠', min: 15, max: 21, color: '#f97316' },
      { label: '重度の不眠', min: 22, max: 28, color: '#ef4444' },
    ],
    cutoffLines: [8, 15, 22],
  },
}

export function getSeverity(
  scaleName: ScaleName,
  score: number
): { label: string; color: string } {
  const scale = SCALE_DEFINITIONS[scaleName]
  const level = scale.severityLevels.find(
    (l: SeverityLevel) => score >= l.min && score <= l.max
  )
  return level
    ? { label: level.label, color: level.color }
    : { label: '不明', color: '#6b7280' }
}

export const SCALE_GROUPS: ScaleGroup[] = [
  {
    diagnosis: 'うつ病・気分障害',
    scales: ['PHQ-9', 'MADRS', 'HAM-D', 'BDI-II'],
    color: '#3b82f6',
  },
  {
    diagnosis: '双極性障害',
    scales: ['YMRS'],
    color: '#f97316',
  },
  {
    diagnosis: '統合失調症',
    scales: ['PANSS', 'BPRS', 'DIEPSS'],
    color: '#8b5cf6',
  },
  {
    diagnosis: '不安障害',
    scales: ['GAD-7', 'CGI'],
    color: '#10b981',
  },
  {
    diagnosis: '不眠症',
    scales: ['ISI'],
    color: '#6366f1',
  },
]

export const SCALE_NAMES: ScaleName[] = [
  'PHQ-9', 'MADRS', 'HAM-D', 'BDI-II', 'YMRS', 'PANSS', 'BPRS', 'DIEPSS', 'CGI', 'ISI', 'GAD-7',
]

export const SCALE_COLORS: Record<ScaleName, string> = {
  'PHQ-9': '#ef4444',   // 赤
  'MADRS': '#f97316',   // オレンジ
  'HAM-D': '#eab308',   // 黄
  'BDI-II': '#22c55e',  // 緑
  'YMRS': '#06b6d4',    // シアン
  'PANSS': '#3b82f6',   // 青
  'BPRS': '#8b5cf6',    // 紫
  'DIEPSS': '#ec4899',  // ピンク
  'CGI': '#84cc16',     // 黄緑
  'ISI': '#a16207',     // 茶
  'GAD-7': '#14b8a6',   // ティール
}
