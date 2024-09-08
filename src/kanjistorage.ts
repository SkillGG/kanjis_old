import { useEffect } from "react";
import { useKanjiStore } from "./store";
import { DEFAULT_KANJIS } from "./defaultKanjis";

export const useKanjiStorage = () => {
    const { mutateKanjis } = useKanjiStore();

    useEffect(() => {
        const LSkanjis = localStorage.getItem("kanjis");
        if (!LSkanjis) {
            console.log("no previous state! Setting default!");
            mutateKanjis(() => DEFAULT_KANJIS);
        } else {
            // merge states
            try {
                const oldKanjis = JSON.parse(LSkanjis);
                mutateKanjis(() => oldKanjis);
            } catch (e) {
                alert(
                    "There was an issue getting your previous data! Resetting!"
                );
                mutateKanjis(() => DEFAULT_KANJIS);
            }
        }
    }, []);
};
