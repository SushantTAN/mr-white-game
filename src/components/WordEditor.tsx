import { useState } from "react";

type Props = {
  wordsInput: string;
  wordsError: string;
  onChangeInput: (v: string) => void;
  onSave: () => void;
  onLoadDefaults: () => void;
};

export default function WordEditor({
  wordsInput,
  wordsError,
  onChangeInput,
  onSave,
  onLoadDefaults
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <section>
      <h2>
        Word Sets
        <button
          style={{
            marginLeft: "10px",
            fontSize: "0.9rem",
            padding: "2px 6px"
          }}
          onClick={() => setOpen((prev) => !prev)}
        >
          {open ? "Close" : "Open"}
        </button>
      </h2>

      {open && (
        <>
          <textarea
            rows={10}
            value={wordsInput}
            onChange={(e) => onChangeInput(e.target.value)}
            placeholder='[{"civilianWord":"apple","undercoverWord":"orange"}]'
          />
          <div className="row gap">
            <button onClick={onSave}>Save Words</button>
            <button onClick={onLoadDefaults}>Load Defaults</button>
          </div>
          {wordsError && <div className="error">{wordsError}</div>}
        </>
      )}
    </section>
  );
}
