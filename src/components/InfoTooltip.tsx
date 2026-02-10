type Props = {
  label: string;
  maksud: string;
  formula: string;
  contoh: string;
};

const InfoTooltip = ({ label, maksud, formula, contoh }: Props) => (
  <span className="info-tooltip" title={`${label}\n${maksud}\nFormula: ${formula}\nContoh: ${contoh}`}>
    ⓘ
  </span>
);

export default InfoTooltip;
