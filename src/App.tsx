import { Helmet } from "react-helmet-async";
import "./App.css";
import { useEffect, useRef, useState } from "react";
import { useKanjiStorage } from "./kanjistorage";
import { Kanji, useKanjiStore } from "./store";
import { DEFAULT_KANJIS } from "./defaultKanjis";

const lvlColor = ["green", "blue", "orange", "red"];
const bgColors = {
    new: "transparent",
    learning: "orange",
    completed: "#282",
} as const;
const hoverColors = {
    new: "var(--main-bg)",
    learning: "orange",
    completed: "#282",
} as const;

const POPUP_SHOW_TIME = 2000;

const doesKanjiFitFilter = (f: string, k: Kanji) => {
    if (f.length <= 0) return true;

    if (f.includes(k.kanji)) return true;

    let lvlEx = f.matchAll(/lvl(\d+)/gi);
    const lvlTab = [...lvlEx];
    for (const [, lvlStr] of lvlTab) {
        if (k.lvl === parseInt(lvlStr)) return true;
    }

    if (f.includes("base") && k.type === "base") return true;
    if (f.includes("extra") && k.type === "extra") return true;
    if (f.includes("new") && k.status === "new") return true;
    if (
        (f.includes("learning") || f.includes("lrn")) &&
        k.status === "learning"
    )
        return true;
    if (
        (f.includes("completed") || f.includes("cpl")) &&
        k.status === "completed"
    )
        return true;
};

// O(7n) <> O(25n)
// Overall O(n)
const getShareLink = (
    kanjis: Kanji[],
    type: "add" | "reset" | "show" | "merge" = "merge"
): string => {
    let sharelink = `${location.protocol}//${location.host}/`;

    const newK: Kanji[] = [];
    const cplK: Kanji[] = [];
    const lrnK: Kanji[] = [];

    const addToLink = (k: Kanji) => {
        // O(1)
        if (k.status === "new") newK.push(k);
        if (k.status === "learning") lrnK.push(k);
        if (k.status === "completed") cplK.push(k);
    };

    for (const kanji of kanjis) {
        // O(n)
        const defaultK = DEFAULT_KANJIS().find((k) => k.kanji === kanji.kanji);
        if (!defaultK) {
            addToLink(kanji);
        } else {
            if (
                defaultK.lvl !== kanji.lvl ||
                defaultK.status !== kanji.status ||
                defaultK.type !== kanji.type
            )
                addToLink(kanji);
        }
    }

    // best case O(2n), worst case O(8n)
    const groupKanjis = (k: Kanji[]): string => {
        let str = "";

        const base = k.filter((f) => f.type === "base"); // O(n)
        const extra = k.filter((f) => f.type === "extra"); // O(n)

        const baseLvl = base.reduce((p, n) => {
            // best case O(0), worst case O(n)
            if (n.lvl in p) {
                p[n.lvl].push(n);
                return p;
            } else {
                return { ...p, [n.lvl]: [n] };
            }
        }, {} as Record<number, Kanji[]>);

        const extraLvl = extra.reduce((p, n) => {
            // best case O(0), worst case O(n)
            if (n.lvl in p) {
                p[n.lvl].push(n);
                return p;
            } else {
                return { ...p, [n.lvl]: [n] };
            }
        }, {} as Record<number, Kanji[]>);

        return `${Object.entries(baseLvl).reduce((prev, y) => {
            // worst case O(n), best case O(0)
            return prev + `(${y[1].map((k) => k.kanji).join("")},${y[0]})`; // worst case O(n), best case O(0)
        }, "")}${Object.entries(extraLvl).reduce((prev, y) => {
            // worst case O(n), best case O(0)
            return prev + `[${y[1].map((k) => k.kanji).join("")},${y[0]}]`; // worst case O(n), best case O(0)
        }, "")}`;
    };

    const newURL = new URL(sharelink);

    const newSearchParams = groupKanjis(newK); // O(2n) <> O(8n)
    const cplSearchParams = groupKanjis(cplK); // O(2n) <> O(8n)
    const lrnSearchParams = groupKanjis(lrnK); // O(2n) <> O(8n)

    newURL.searchParams.set("n", newSearchParams);
    newURL.searchParams.set("c", cplSearchParams);
    newURL.searchParams.set("l", lrnSearchParams);
    if (type === "reset") newURL.searchParams.set("t", "r"); // reset the importing device's values to default before importing
    if (type === "add") newURL.searchParams.set("t", "a"); // add only the newly added kanjis
    if (type === "merge") newURL.searchParams.set("t", "m"); // override only statuses
    if (type === "show") newURL.searchParams.set("t", "p"); // TODO: Show the table, withot changing any importee data

    return newURL.toString();
};

function App() {
    useKanjiStorage();

    const { kanjis, mutateKanjis, updateKanji, addKanji, removeKanji } =
        useKanjiStore();

    const [kanjisToSelect, setKanjisToSelect] = useState("");

    const [filter, setFilter] = useState("");

    const [rowCount, setRowCount] = useState(
        parseInt(localStorage.getItem("rowCount") ?? "0") || 10
    );

    const [popup, setPopup] = useState<{
        text: React.ReactNode;
        time?: number;
        borderColor?: string;
        color?: string;
    } | null>(null);
    const [popupOpen, setPopupOpen] = useState(false);

    useEffect(() => {
        if (popup === null) return;
        setPopupOpen(true);
        const oT = setTimeout(() => {
            setPopupOpen(false);
        }, popup.time ?? POPUP_SHOW_TIME);
        return () => {
            clearTimeout(oT);
        };
    }, [popup]);

    useEffect(() => {
        if (!popupOpen) {
            const cT = setTimeout(() => {
                setPopup(null);
            }, 200);
            return () => {
                clearTimeout(cT);
            };
        }
    }, [popupOpen]);

    useEffect(() => {
        localStorage.setItem("rowCount", `${rowCount}`);
    }, [rowCount]);

    const addRef = useRef<HTMLDialogElement>(null);
    const clearAddRef = useRef<HTMLButtonElement>(null);

    return (
        <>
            <Helmet>
                <meta charSet="utf-8" />
                <title>Kanji learning page</title>
            </Helmet>
            <div>
                {popup && (
                    <div
                        className="popup"
                        style={{
                            "--borderColor": popup.borderColor ?? "green",
                            "--textColor": popup.color ?? "white",
                        }}
                        data-open={popupOpen ? "open" : "closed"}
                    >
                        <div>{popup.text}</div>
                    </div>
                )}
                <div
                    id="settings"
                    style={{
                        flexWrap: "wrap",
                        display: "flex",
                        width: "100%",
                        justifyContent: "space-around",
                        marginBottom: "3px",
                    }}
                >
                    <div
                        className="setting-menu"
                        style={{ flexDirection: "column" }}
                    >
                        <div style={{ color: bgColors.learning }}>Learning</div>
                        <div style={{ color: bgColors.completed }}>
                            Completed
                        </div>
                    </div>
                    <div className="setting-menu">
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(
                                    getShareLink(kanjis)
                                );
                                setPopup({
                                    text: (
                                        <div style={{ textAlign: "center" }}>
                                            Copied to clipboard!
                                            <br />
                                            You can share it to your other
                                            devices!
                                            <br />
                                            <span style={{ color: "red" }}>
                                                Going into this link will
                                                override the
                                                <br />
                                                data from the importing device!
                                            </span>
                                        </div>
                                    ),
                                });
                            }}
                        >
                            Get save link
                        </button>
                        <button
                            onClick={() => {
                                clearAddRef.current?.click();
                                addRef.current?.showModal();
                            }}
                        >
                            Add kanjis
                        </button>
                        <dialog ref={addRef}>
                            List kanjis to add
                            <form
                                style={{
                                    margin: "0 auto",
                                    textAlign: "center",
                                }}
                                action="#"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    const form =
                                        addRef.current?.querySelector("form");
                                    if (form) {
                                        const arf = new FormData(form);
                                        const kanjis = arf.get("kanjis");
                                        const type = arf.get("type");
                                        const lvlStr = arf.get("lvl");
                                        const status = arf.get("status");

                                        if (
                                            !kanjis ||
                                            !type ||
                                            !status ||
                                            !lvlStr ||
                                            typeof kanjis !== "string" ||
                                            typeof lvlStr !== "string"
                                        )
                                            return;

                                        const lvl = parseInt(lvlStr);
                                        if (isNaN(lvl) || lvl < 1) return;

                                        if (type !== "base" && type !== "extra")
                                            return;
                                        if (
                                            status !== "new" &&
                                            status !== "learning" &&
                                            status !== "completed"
                                        )
                                            return;

                                        for (const kanji of kanjis) {
                                            addKanji({
                                                kanji,
                                                lvl,
                                                type,
                                                status,
                                            });
                                        }

                                        addRef.current?.close();
                                    }
                                }}
                            >
                                <input required name="kanjis" />
                                <br />
                                <br />
                                Status:
                                <br />
                                <label>
                                    New{" "}
                                    <input
                                        required
                                        type="radio"
                                        value="new"
                                        name="status"
                                    />
                                </label>
                                <br />
                                <label>
                                    Learning{" "}
                                    <input
                                        required
                                        type="radio"
                                        value="learning"
                                        name="status"
                                    />
                                </label>
                                <br />
                                <label>
                                    Completed{" "}
                                    <input
                                        required
                                        type="radio"
                                        name="status"
                                        value="completed"
                                    />
                                </label>
                                <br />
                                Type:
                                <br />
                                <label>
                                    Base{" "}
                                    <input
                                        required
                                        type="radio"
                                        name="type"
                                        value="base"
                                    />
                                </label>
                                <br />
                                <label>
                                    Extra{" "}
                                    <input
                                        required
                                        type="radio"
                                        name="type"
                                        value="extra"
                                    />
                                </label>
                                <br />
                                <label>
                                    Level:
                                    <input
                                        type="number"
                                        min="1"
                                        step="1"
                                        name="lvl"
                                    />
                                </label>
                                <div style={{ marginTop: "5px" }}>
                                    <button type="submit">Add</button>
                                    <button
                                        type="button"
                                        onClick={(e) => addRef.current?.close()}
                                    >
                                        Cancel
                                    </button>
                                    <button type="reset" ref={clearAddRef}>
                                        Clear
                                    </button>
                                </div>
                            </form>
                            <br />
                        </dialog>
                    </div>
                    <div className="setting-menu">
                        <input
                            value={kanjisToSelect}
                            onChange={(e) => setKanjisToSelect(e.target.value)}
                            placeholder="森 or lvl1 base cpl"
                        />{" "}
                        <button
                            onClick={() => {
                                setFilter(kanjisToSelect);
                            }}
                        >
                            Filter
                        </button>
                        <button
                            onClick={() => {
                                document
                                    .querySelectorAll(".kanjiBtn")
                                    .forEach((e) => (e as HTMLElement).click());
                            }}
                        >
                            Click
                        </button>
                        <button
                            onClick={() => {
                                setFilter("");
                            }}
                        >
                            Clear
                        </button>
                    </div>
                    <div className="setting-menu">
                        <button
                            onClick={() => {
                                mutateKanjis(() => [...DEFAULT_KANJIS()]);
                                setPopup({
                                    text: <span>Reset successful!</span>,
                                    borderColor: "red",
                                });
                            }}
                        >
                            Reset to Default
                        </button>
                    </div>
                    <div
                        className="setting-menu"
                        style={{
                            flexDirection: "column",
                        }}
                    >
                        Kanji per row:
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                flexDirection: "row",
                                justifyContent: "center",
                            }}
                        >
                            <button onClick={() => setRowCount((p) => p + 1)}>
                                +
                            </button>
                            {rowCount}
                            <button
                                onClick={() =>
                                    setRowCount((p) => (p === 1 ? 1 : p - 1))
                                }
                            >
                                -
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div
                style={{
                    display: "grid",
                    margin: "0 auto",
                    gap: "1px",
                    gridAutoFlow: "row",
                    gridTemplateColumns: "1fr ".repeat(rowCount),
                    width: "fit-content",
                }}
            >
                {kanjis
                    .filter(
                        (f) =>
                            filter.includes(f.kanji) ||
                            doesKanjiFitFilter(filter, f)
                    )
                    .map(({ kanji, status, type, lvl }) => {
                        return (
                            <button
                                onContextMenu={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    removeKanji(kanji);
                                }}
                                onClick={(e) => {
                                    (e.target as HTMLElement)?.blur();
                                    updateKanji(kanji, {
                                        status:
                                            status === "new"
                                                ? "learning"
                                                : status === "learning"
                                                ? "completed"
                                                : "new",
                                    });
                                }}
                                key={kanji}
                                id={kanji}
                                className="kanjiBtn"
                                style={{
                                    "--hoverColor": hoverColors[status],
                                    "--bgColor": bgColors[status],
                                    fontSize: "2em",
                                    textDecoration:
                                        type == "base" ? "none" : "underline",
                                    border: `2px solid ${
                                        lvl <= lvlColor.length
                                            ? lvlColor[lvl - 1]
                                            : lvlColor[lvlColor.length - 1]
                                    }`,
                                    padding: "0.4em",
                                }}
                                title={`${type} kanji lvl ${lvl}`}
                            >
                                {kanji}
                            </button>
                        );
                    })}
            </div>
        </>
    );
}

export default App;
