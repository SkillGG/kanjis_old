import { useEffect } from "react";
import { Kanji, KanjiStatus, KanjiType, useKanjiStore } from "./store";
import { DEFAULT_KANJIS, removeDuplicates } from "./defaultKanjis";

const getLocationKanjis = (search: string): Kanji[] => {
    const locKanjis = [] as Kanji[];

    // &n = new
    // &c = comp
    // &l = learn
    // (勉強,2);(漢字,4);[失態,4]  = base 勉 and 強 lvl2 + base 漢 and 字 lvl 4 + extra 失 and 態 lvl 4

    const newMatch = search.match(/(?:\?|&)n=([^\?&]*)/i);

    const parseLocKanjiList = (l: string | null, s: KanjiStatus) => {
        if (!l) return null;
        const lists = [
            ...decodeURIComponent(l).matchAll(/(\(|\[)(.*?),(\d+)(?:\)|\])/gi),
        ];

        const allKanjis = [] as Kanji[];

        for (const list of lists) {
            const type = (list[1] === "(" ? "base" : "extra") as KanjiType;
            const lvl = parseInt(list[3]);
            const kanjis = list[2];
            if (isNaN(lvl) || lvl < 1) continue;
            for (const k of kanjis) {
                allKanjis.push({ kanji: k, type, lvl, status: s });
            }
        }

        return allKanjis;
    };

    const news = parseLocKanjiList(newMatch?.[1] ?? null, "new");
    if (news) locKanjis.push(...news);

    const compMatch = search.match(/(?:\?|&)c=([^\?&]*)/i);
    const comps = parseLocKanjiList(compMatch?.[1] ?? null, "completed");
    if (comps) locKanjis.push(...comps);

    const learnMatch = search.match(/(?:\?|&)l=([^\?&]*)/i);
    const lrns = parseLocKanjiList(learnMatch?.[1] ?? null, "learning");
    if (lrns) locKanjis.push(...lrns);

    return locKanjis;
};

export const useKanjiStorage = () => {
    const { mutateKanjis } = useKanjiStore();

    useEffect(() => {
        const locationKanjis = getLocationKanjis(location.search);

        const force = location.search.includes("f=f");

        history.replaceState("", "", "/#");

        const LSkanjis = localStorage.getItem("kanjis");
        if (!LSkanjis) {
            console.log("no previous state! Setting default!");
            mutateKanjis(() =>
                removeDuplicates(DEFAULT_KANJIS().concat(locationKanjis), force)
            );
        } else {
            // merge states
            try {
                const oldKanjis = JSON.parse(LSkanjis);
                if (Array.isArray(oldKanjis))
                    mutateKanjis(() =>
                        removeDuplicates(
                            oldKanjis.concat(locationKanjis),
                            force
                        )
                    );
            } catch (e) {
                alert(
                    "There was an issue getting your previous data! Resetting!"
                );
                mutateKanjis(() =>
                    removeDuplicates(
                        DEFAULT_KANJIS().concat(locationKanjis),
                        force
                    )
                );
            }
        }
    }, []);
};
