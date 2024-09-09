import { useEffect } from "react";

import { gt, lt, valid } from "semver";

import { Kanji, KanjiStatus, KanjiType, useKanjiStore } from "./store";
import {
    DEFAULT_KANJI_VERSION,
    DEFAULT_KANJIS,
    MERGE_STATUSES,
    NO_OVERRIDE,
    OVERRIDE_ALL,
    removeDuplicates,
} from "./defaultKanjis";

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

export const LS_KEYS = {
    kanjis: "kanjis",
    kanji_ver: "default_kanji_version",
} as const;

export const useKanjiStorage = () => {
    const { mutateKanjis, setShouldUpdate } = useKanjiStore();

    useEffect(() => {
        const locationKanjis = getLocationKanjis(location.search);

        const overrideType = (/t=(a|r|p|m)/i.exec(location.search)?.[1] ??
            "x") as "a" | "r" | "p" | "m" | "x";

        if (overrideType != "p") history.replaceState("", "", "/#");

        const strategies = {
            a: NO_OVERRIDE,
            r: OVERRIDE_ALL,
            p: NO_OVERRIDE,
            m: MERGE_STATUSES,
            x: NO_OVERRIDE,
        } as const;

        const LSkanjis = localStorage.getItem(LS_KEYS.kanjis);

        const lastVersion = localStorage.getItem(LS_KEYS.kanji_ver);

        console.log(valid(lastVersion));

        if (!lastVersion || !valid(lastVersion)) {
            setShouldUpdate(true);
        } else {
            if (gt(DEFAULT_KANJI_VERSION, lastVersion)) {
                setShouldUpdate(true);
            }
        }

        if (!LSkanjis) {
            mutateKanjis(() => {
                localStorage.setItem(LS_KEYS.kanji_ver, DEFAULT_KANJI_VERSION);
                return removeDuplicates(
                    DEFAULT_KANJIS().concat(locationKanjis),
                    strategies[overrideType]
                );
            });
        } else {
            // merge states
            try {
                const oldKanjis = JSON.parse(LSkanjis);
                if (Array.isArray(oldKanjis))
                    mutateKanjis(() => {
                        localStorage.setItem(
                            LS_KEYS.kanji_ver,
                            DEFAULT_KANJI_VERSION
                        );
                        return removeDuplicates(
                            (overrideType === "r"
                                ? DEFAULT_KANJIS()
                                : oldKanjis
                            ).concat(locationKanjis),
                            strategies[overrideType]
                        );
                    });
            } catch (e) {
                alert(
                    "There was an issue getting your previous data! Resetting!"
                );
                mutateKanjis(() => {
                    localStorage.setItem(
                        LS_KEYS.kanji_ver,
                        DEFAULT_KANJI_VERSION
                    );
                    return removeDuplicates(
                        DEFAULT_KANJIS().concat(locationKanjis),
                        strategies[overrideType]
                    );
                });
            }
        }
    }, []);
};
