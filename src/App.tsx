import { Helmet } from "react-helmet-async";
import "./App.css";
import { useEffect, useRef, useState } from "react";
import { useKanjiStorage } from "./kanjistorage";
import { useKanjiStore } from "./store";
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

function App() {
    useKanjiStorage();

    const { kanjis, mutateKanjis, updateKanji, addKanji, removeKanji } =
        useKanjiStore();

    const [kanjisToSelect, setKanjisToSelect] = useState("");

    const [rowCount, setRowCount] = useState(
        parseInt(localStorage.getItem("rowCount") ?? "0") || 10
    );

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
                <div
                    id="settings"
                    style={{
                        display: "flex",
                        width: "100%",
                        justifyContent: "space-around",
                        marginBottom: "3px",
                    }}
                >
                    <div>
                        <div style={{ color: bgColors.learning }}>Learning</div>
                        <div style={{ color: bgColors.completed }}>
                            Completed
                        </div>
                    </div>
                    <div>
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
                    <div>
                        <input
                            value={kanjisToSelect}
                            onChange={(e) => setKanjisToSelect(e.target.value)}
                            placeholder="e.g. 森"
                        />{" "}
                        <button
                            onClick={() => {
                                for (const kj of kanjisToSelect) {
                                    try {
                                        document
                                            .querySelector<HTMLButtonElement>(
                                                `#${kj}`
                                            )
                                            ?.click();
                                    } catch (e) {
                                        continue;
                                    }
                                }
                            }}
                        >
                            Click
                        </button>
                    </div>
                    <div>
                        <button
                            onClick={() => {
                                mutateKanjis(() => DEFAULT_KANJIS);
                            }}
                        >
                            Reset to Default
                        </button>
                    </div>
                    <div>
                        Kanji per row:
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
                {kanjis.map(({ kanji, status, type, lvl }) => {
                    return (
                        <button
                            onContextMenu={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                removeKanji(kanji);
                            }}
                            onClick={() => {
                                console.log("changing value for kanji");
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
                                border: `2px solid ${lvlColor[lvl - 1]}`,
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
