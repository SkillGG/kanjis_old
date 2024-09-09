import { useEffect } from "react";
import { create, createStore } from "zustand";
import { DEFAULT_KANJIS } from "./defaultKanjis";

export const KanjiStatus = ["new", "learning", "completed"] as const;

export type KanjiStatus = (typeof KanjiStatus)[number];

export const KanjiType = ["base", "extra"] as const;

export type KanjiType = (typeof KanjiType)[number];

export type Kanji = {
    status: KanjiStatus;
    type: KanjiType;
    kanji: string;
    lvl: number;
};

export type Store = {
    kanjis: Kanji[];
    shouldUpdate: boolean;
    setShouldUpdate: (su: boolean) => void;
    mutateKanjis: (mutation: (k: Store["kanjis"]) => Store["kanjis"]) => void;
    updateKanji: (kanji: string, data: Partial<Omit<Kanji, "kanji">>) => void;
    addKanji: (kanji: Kanji) => void;
    removeKanji: (kanji: string) => void;
};

export const useKanjiStore = create<Store>((_set, _get) => {
    return {
        kanjis: [],
        shouldUpdate: false,
        setShouldUpdate(su) {
            _set((prev) => ({ ...prev, shouldUpdate: su }));
        },
        mutateKanjis: (mut: (k: Store["kanjis"]) => Store["kanjis"]) => {
            _set((prev) => {
                const kanjis = mut(prev.kanjis);
                localStorage.setItem("kanjis", JSON.stringify(kanjis));
                return { ...prev, kanjis };
            });
        },
        updateKanji(kanji, data) {
            _set((prev) => {
                const kanjis = [...prev.kanjis];
                const found = kanjis.find((k) => k.kanji === kanji);
                if (found) {
                    found.lvl = data.lvl ?? found.lvl;
                    found.status = data.status ?? found.status;
                    found.type = data.type ?? found.type;
                }
                localStorage.setItem("kanjis", JSON.stringify(kanjis));
                return { ...prev, kanjis };
            });
        },
        addKanji(kanji) {
            _set((prev) => {
                if (prev.kanjis.find((k) => k.kanji === kanji.kanji))
                    return prev;
                const kanjis = [...prev.kanjis, kanji];
                localStorage.setItem("kanjis", JSON.stringify(kanjis));
                return { ...prev, kanjis };
            });
        },

        removeKanji(kanji) {
            _set((prev) => {
                const newStore = {
                    ...prev,
                    kanjis: [...prev.kanjis.filter((k) => k.kanji !== kanji)],
                };
                localStorage.setItem("kanjis", JSON.stringify(newStore.kanjis));
                return newStore;
            });
        },
    };
});
