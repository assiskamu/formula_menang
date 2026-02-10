import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import Badge from "../components/Badge";
import { useDashboard } from "../data/dashboard";
import type { LocalCandidateOverride } from "../data/types";

const emptyCandidate = (): LocalCandidateOverride => ({ candidate_name: "", party: "", votes: 0, vote_share_pct: 0 });

const availabilityTone = (hasDetails: boolean, hasCandidates: boolean) => {
  if (hasDetails && hasCandidates) return { label: "Lengkap", tone: "ok" as const };
  if (hasDetails || hasCandidates) return { label: "Separuh", tone: "warn" as const };
  return { label: "Tiada", tone: "neutral" as const };
};

const isFiniteNumber = (value: number) => Number.isFinite(value) && !Number.isNaN(value);

const KemasKiniData = () => {
  const {
    allDunOptions,
    metrics,
    candidatesByDun,
    localOverrides,
    saveSeatOverride,
    saveCandidateOverride,
    resetLocalOverrides,
    importLocalOverrides,
  } = useDashboard();

  const [search, setSearch] = useState("");
  const [selectedDun, setSelectedDun] = useState("");
  const [registeredVoters, setRegisteredVoters] = useState("");
  const [totalVotesCast, setTotalVotesCast] = useState("");
  const [turnoutPct, setTurnoutPct] = useState("");
  const [majorityVotes, setMajorityVotes] = useState("");
  const [candidateRows, setCandidateRows] = useState<LocalCandidateOverride[]>([]);
  const [toastMessage, setToastMessage] = useState("");
  const [validationError, setValidationError] = useState("");

  const filteredDunOptions = useMemo(
    () => allDunOptions.filter((d) => `${d.code} ${d.name}`.toLowerCase().includes(search.toLowerCase())),
    [allDunOptions, search]
  );

  const selectedMetric = useMemo(
    () => metrics.find((metric) => metric.seat.grain === "dun" && metric.seat.dun_code === selectedDun),
    [metrics, selectedDun]
  );

  const showToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(""), 2200);
  };

  useEffect(() => {
    if (!selectedDun && allDunOptions[0]) {
      setSelectedDun(allDunOptions[0].code);
    }
  }, [allDunOptions, selectedDun]);

  useEffect(() => {
    if (!selectedDun || !selectedMetric) return;
    const localSeat = localOverrides.seatDetails[selectedDun] ?? {};
    setRegisteredVoters(`${localSeat.registered_voters ?? selectedMetric.seat.registered_voters ?? ""}`);
    setTotalVotesCast(`${localSeat.total_votes_cast ?? selectedMetric.seat.total_votes_cast ?? ""}`);
    setTurnoutPct(`${localSeat.turnout_pct ?? selectedMetric.seat.turnout_pct ?? ""}`);
    setMajorityVotes(`${localSeat.majority_votes ?? selectedMetric.seat.majority_votes ?? ""}`);

    const localCandidates = localOverrides.candidates[selectedDun];
    if (localCandidates && localCandidates.length > 0) {
      setCandidateRows(localCandidates);
      return;
    }

    const baseCandidates = candidatesByDun.get(selectedDun) ?? [];

    setCandidateRows(
      baseCandidates.length > 0
        ? baseCandidates.map((candidate) => ({
            candidate_name: candidate.candidate_name,
            party: candidate.party,
            votes: candidate.votes,
            vote_share_pct: candidate.vote_share_pct,
          }))
        : [emptyCandidate()]
    );
  }, [selectedDun, selectedMetric, localOverrides, candidatesByDun]);

  useEffect(() => {
    const registered = Number(registeredVoters);
    const cast = Number(totalVotesCast);
    if (!isFiniteNumber(registered) || !isFiniteNumber(cast) || registered <= 0) return;
    const autoPct = (cast / registered) * 100;
    if (!Number.isNaN(autoPct) && Number.isFinite(autoPct) && turnoutPct === "") {
      setTurnoutPct(autoPct.toFixed(2));
    }
  }, [registeredVoters, totalVotesCast, turnoutPct]);

  const validateSeat = () => {
    const registered = Number(registeredVoters);
    const cast = Number(totalVotesCast);
    const turnout = Number(turnoutPct);
    const majority = Number(majorityVotes);

    if ([registered, cast, turnout, majority].some((value) => !isFiniteNumber(value))) {
      return "Semua nilai kerusi mesti nombor sah.";
    }
    if (registered < 0 || cast < 0 || turnout < 0 || majority < 0) {
      return "Nilai kerusi tidak boleh negatif.";
    }
    if (turnout > 100) {
      return "Turnout mesti antara 0 hingga 100.";
    }
    return "";
  };

  const validateCandidates = () => {
    for (const row of candidateRows) {
      if (row.votes < 0 || !Number.isInteger(row.votes)) return "Undi calon mesti integer >= 0.";
      if (row.vote_share_pct !== undefined && (row.vote_share_pct < 0 || row.vote_share_pct > 100)) return "% undi calon mesti antara 0 hingga 100.";
    }
    return "";
  };

  const onSaveSeat = () => {
    if (!selectedDun) return;
    const err = validateSeat();
    if (err) {
      setValidationError(err);
      return;
    }
    saveSeatOverride(selectedDun, {
      registered_voters: Number(registeredVoters),
      total_votes_cast: Number(totalVotesCast),
      turnout_pct: Number(turnoutPct),
      majority_votes: Number(majorityVotes),
    });
    setValidationError("");
    showToast("Data disimpan");
  };

  const onSaveCandidates = () => {
    if (!selectedDun) return;
    const err = validateCandidates();
    if (err) {
      setValidationError(err);
      return;
    }
    const cleaned = candidateRows
      .filter((row) => row.candidate_name.trim() || row.party.trim() || row.votes > 0)
      .map((row) => ({
        candidate_name: row.candidate_name.trim(),
        party: row.party.trim(),
        votes: Math.max(0, Math.trunc(row.votes)),
        vote_share_pct: row.vote_share_pct,
      }));
    saveCandidateOverride(selectedDun, cleaned);
    setValidationError("");
    showToast("Data disimpan");
  };

  const autoKiraPeratus = () => {
    const totalVotes = candidateRows.reduce((acc, row) => acc + row.votes, 0);
    if (totalVotes <= 0) return;
    setCandidateRows((prev) =>
      prev.map((row) => ({
        ...row,
        vote_share_pct: Number(((row.votes / totalVotes) * 100).toFixed(2)),
      }))
    );
  };

  const autoKiraMajoriti = () => {
    const sorted = [...candidateRows].sort((a, b) => b.votes - a.votes);
    const majority = Math.max(0, (sorted[0]?.votes ?? 0) - (sorted[1]?.votes ?? 0));
    setMajorityVotes(`${majority}`);
    if (selectedDun) {
      saveSeatOverride(selectedDun, {
        registered_voters: Number(registeredVoters) || 0,
        total_votes_cast: Number(totalVotesCast) || 0,
        turnout_pct: Number(turnoutPct) || 0,
        majority_votes: majority,
      });
    }
    showToast("Majoriti dikira automatik");
  };

  const onExport = () => {
    const blob = new Blob([JSON.stringify(localOverrides, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `formula-menang-overrides-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const onImport = async (event: ChangeEvent<HTMLInputElement>, mode: "merge" | "replace") => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const payload = JSON.parse(await file.text());
      importLocalOverrides(payload, mode);
      showToast("Import berjaya");
      setValidationError("");
    } catch {
      setValidationError("Fail JSON tidak sah.");
    } finally {
      event.target.value = "";
    }
  };

  const onReset = () => {
    if (!window.confirm("Padam semua perubahan data tempatan?")) return;
    resetLocalOverrides();
    showToast("Semua perubahan tempatan direset");
  };

  const availability = availabilityTone(Boolean(selectedMetric?.seat.details_available), Boolean(selectedMetric?.seat.candidates_available));

  return (
    <section className="stack">
      <div className="card">
        <h2>Kemas Kini Data</h2>
        <p className="muted">Data disimpan dalam browser, bukan server.</p>
        <div className="data-actions">
          <button type="button" onClick={onExport}>Export Data (JSON)</button>
          <label className="file-import">Import Data (JSON) [Merge]
            <input type="file" accept="application/json" onChange={(event) => void onImport(event, "merge")} />
          </label>
          <label className="file-import">Import Data (JSON) [Replace]
            <input type="file" accept="application/json" onChange={(event) => void onImport(event, "replace")} />
          </label>
          <button type="button" className="danger" onClick={onReset}>Reset local changes</button>
        </div>
        {toastMessage && <p className="toast-success">✅ {toastMessage}</p>}
        {validationError && <p className="toast-error">⚠️ {validationError}</p>}
      </div>

      <div className="grid two-col">
        <div className="card step-card">
          <h3>1) Pilih DUN</h3>
          <input type="search" placeholder="Cari kod/nama DUN" value={search} onChange={(event) => setSearch(event.target.value)} />
          <select value={selectedDun} onChange={(event) => setSelectedDun(event.target.value)}>
            {filteredDunOptions.map((dun) => (
              <option key={dun.code} value={dun.code}>{dun.code} {dun.name}</option>
            ))}
          </select>
          <div>Data semasa: <Badge label={availability.label} tone={availability.tone} /></div>
        </div>

        <div className="card step-card">
          <h3>2) Butiran Kerusi</h3>
          <label>Registered Voters<input type="number" min={0} value={registeredVoters} onChange={(event) => setRegisteredVoters(event.target.value)} /></label>
          <label>Total Votes Cast<input type="number" min={0} value={totalVotesCast} onChange={(event) => setTotalVotesCast(event.target.value)} /></label>
          <label>Turnout %<input type="number" min={0} max={100} step="0.01" value={turnoutPct} onChange={(event) => setTurnoutPct(event.target.value)} /></label>
          <label>Majority<input type="number" min={0} value={majorityVotes} onChange={(event) => setMajorityVotes(event.target.value)} /></label>
          <button type="button" onClick={onSaveSeat}>Simpan Butiran Kerusi</button>
        </div>
      </div>

      <div className="card step-card">
        <h3>3) Undi Setiap Calon</h3>
        <div className="data-actions">
          <button type="button" onClick={() => setCandidateRows((prev) => [...prev, emptyCandidate()])}>Tambah Calon</button>
          <button type="button" onClick={autoKiraPeratus}>Auto kira % undi</button>
          <button type="button" onClick={autoKiraMajoriti}>Auto kira majoriti</button>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Nama Calon</th>
                <th>Parti</th>
                <th>Undi</th>
                <th>% Undi</th>
                <th>Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {candidateRows.map((row, index) => (
                <tr key={`candidate-${index}`}>
                  <td><input value={row.candidate_name} onChange={(event) => setCandidateRows((prev) => prev.map((item, i) => i === index ? { ...item, candidate_name: event.target.value } : item))} /></td>
                  <td><input value={row.party} onChange={(event) => setCandidateRows((prev) => prev.map((item, i) => i === index ? { ...item, party: event.target.value } : item))} /></td>
                  <td><input type="number" min={0} step={1} value={row.votes} onChange={(event) => setCandidateRows((prev) => prev.map((item, i) => i === index ? { ...item, votes: Math.max(0, Math.trunc(Number(event.target.value) || 0)) } : item))} /></td>
                  <td><input type="number" min={0} max={100} step="0.01" value={row.vote_share_pct ?? 0} onChange={(event) => setCandidateRows((prev) => prev.map((item, i) => i === index ? { ...item, vote_share_pct: Number(event.target.value) } : item))} /></td>
                  <td><button type="button" onClick={() => setCandidateRows((prev) => prev.filter((_, i) => i !== index))}>Buang</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button type="button" onClick={onSaveCandidates}>4) Simpan Undi Calon</button>
      </div>
    </section>
  );
};

export default KemasKiniData;
