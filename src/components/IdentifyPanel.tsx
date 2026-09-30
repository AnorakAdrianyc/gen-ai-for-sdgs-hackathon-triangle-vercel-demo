import type { Facility } from "../services/identify";
export interface IdentifyState {
  coordinate: [number, number];
  loading: boolean;
  facilities: Facility[];
  error?: string;
}
export function IdentifyPanel({
  state,
  onClose,
  onRetry,
}: {
  state: IdentifyState;
  onClose: () => void;
  onRetry: () => void;
}) {
  return (
    <aside
      aria-label="位置查詢結果"
      className="absolute z-20 bottom-14 right-4 z-10 max-h-[55dvh] w-[min(360px,calc(100%-32px))] overflow-y-auto rounded-xl border border-white/15 bg-[#101719]/95 p-4 text-sm shadow-xl backdrop-blur-md"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-medium text-teal-200">地政總署 · 位置查詢</h2>
        <button
          aria-label="關閉查詢"
          onClick={onClose}
          className="rounded px-3 py-1 hover:bg-slate-700"
        >
          ✕
        </button>
      </div>
      <p className="mt-1 text-xs text-slate-400">
        {state.coordinate.map((n) => n.toFixed(5)).join(", ")}
      </p>
      <div aria-live="polite" className="mt-3">
        {state.loading ? (
          <p>正在查詢此位置…</p>
        ) : state.error ? (
          <>
            <p role="alert" className="text-amber-200">
              {state.error}
            </p>
            <button
              onClick={onRetry}
              className="mt-2 rounded bg-slate-700 px-3 py-2"
            >
              重試查詢
            </button>
          </>
        ) : state.facilities.length === 0 ? (
          <p className="text-slate-300">
            此位置沒有可用的設施資料。請點選附近建築物；Identify
            並非附近設施搜尋。
          </p>
        ) : (
          <>
            <p className="mb-3 text-xs text-slate-400">
              找到 {state.facilities.length} 項資料
            </p>
            {state.facilities.map((f) => (
              <article key={f.id} className="border-t border-white/10 py-3">
                <p className="text-xs text-teal-300">{f.category}</p>
                <h3 className="mt-1 font-medium">{f.name}</h3>
                {f.address !== f.name && (
                  <p className="mt-1 text-slate-300">{f.address}</p>
                )}
                {f.details.length > 0 && (
                  <details className="mt-2 text-xs text-slate-400">
                    <summary className="cursor-pointer">詳細資料</summary>
                    <dl className="mt-2 space-y-2">
                      {f.details.map(([k, v]) => (
                        <div key={k}>
                          <dt>{k}</dt>
                          <dd className="text-slate-200">{v}</dd>
                        </div>
                      ))}
                    </dl>
                  </details>
                )}
              </article>
            ))}
          </>
        )}
      </div>
      <p className="mt-3 text-[10px] text-slate-500">
        查詢所點選的地理位置，非三維模型的個別物件屬性。
      </p>
    </aside>
  );
}
