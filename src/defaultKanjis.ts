import { Kanji } from "./store";

const l1Kanjis = `
日月木山川田人口車門
火水金土子女学先生私
一二三四五六七八九十百千万円年
上下中大小本半分力何
明休体好男林森間畑岩
目耳手足雨竹米貝石糸
花茶肉文字物牛馬鳥魚
新古長短高安低暗多少
行来帰食飲見聞読書話買教
朝昼夜晩夕方午前後毎週曜
作泳油海酒待校時言計語飯
宅客室家英薬会今雪雲電売
広店度病疲痛屋国回困開閉
近遠速遅道青晴静寺持荷歌
友父母兄弟姉妹夫妻彼主奥
元気有名親切便利不若早忙
出入乗降着渡通走歩止動働
右左東南北西外内部駅社院
地鉄工場図館公園住所番号
市町村区都府県島京様
練習勉強研究留質問題答宿
政治経済歴史育化理数科医
`;
const l2Kanjis = `
映画写真音楽料組思色白黒赤
起寝遊立座使始終貸借返送
結婚離欠席予定洋式和活
春夏秋冬暑熱寒冷暖温涼天
仕事運転者記議員商業農
良悪正違同適当難次形味
試験面接説果合格受落残念
指折払投打深洗流消決
旅約案準備相談連絡泊特急
線発到交機関局信路故注意
押引割営自由取求願知
台窓具器用服紙辞雑誌
銀資品個価産期々報告
感心情悲泣笑頭覚忘考
伝代呼焼曲脱別集並喜驚
細太重軽狭弱眠苦簡単
空港飛階建設完成費放
位置横向原平野風両橋
老族配術退効民訪顔歯
卒論実調必要類得失礼
増加減変移続過進以美
比反対賛共直表現初
全最無非第的性法律制課`;

const toKanji = (s: string, d: Omit<Kanji, "kanji">) => {
    return [...new Set(s)]
        .filter((f) => f !== "\n")
        .map<Kanji>((v) => ({ ...d, kanji: v }));
};

type KanjiOverrideStrategy = (p: Kanji, n: Kanji) => Kanji;

export const removeDuplicates = (
    k: Kanji[],
    mergeStrategy: KanjiOverrideStrategy = (p) => p
) => {
    const retArr = [] as Kanji[];
    for (const kanji of k) {
        const obj = retArr.find((z) => z.kanji === kanji.kanji);
        if (obj) {
            const nObj = mergeStrategy(obj, kanji);
            obj.lvl = nObj.lvl;
            obj.status = nObj.status;
            obj.type = nObj.type;
        } else {
            retArr.push(kanji);
        }
    }
    return retArr;
};

export const OVERRIDE_ALL: KanjiOverrideStrategy = (_, n) => n;
export const MERGE_STATUSES: KanjiOverrideStrategy = (p, n) => ({
    ...p,
    status: n.status,
});
export const NO_OVERRIDE: KanjiOverrideStrategy = (p) => p;

export const DEFAULT_KANJIS = () =>
    removeDuplicates(
        toKanji(l1Kanjis, { status: "new", type: "base", lvl: 1 }).concat(
            toKanji(l2Kanjis, { status: "new", type: "base", lvl: 2 })
        ),
        OVERRIDE_ALL
    );
