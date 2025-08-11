

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
  return (
    <section>
      <h2>Word Sets (editable JSON)</h2>
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
    </section>
  );
}
