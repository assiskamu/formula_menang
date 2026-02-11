type HelpModalProps = {
  open: boolean;
  onClose: () => void;
};

const HelpModal = ({ open, onClose }: HelpModalProps) => {
  if (!open) return null;

  return (
    <div className="bottom-sheet-overlay" role="dialog" aria-modal="true" aria-label="Cara guna" onClick={onClose}>
      <div className="bottom-sheet cara-guna-modal" onClick={(event) => event.stopPropagation()}>
        <div className="bottom-sheet-header">
          <h2>Cara Guna (1 min)</h2>
          <button type="button" onClick={onClose}>Tutup</button>
        </div>
        <ol>
          <li>Pilih kawasan Parlimen dan DUN.</li>
          <li>Lihat status kerusi dengan 3 kad ringkas.</li>
          <li>Ikut cadangan BASE / PERSUASION / GOTV hari ini.</li>
          <li>Semak risiko atau sasaran bila perlu.</li>
        </ol>
      </div>
    </div>
  );
};

export default HelpModal;
