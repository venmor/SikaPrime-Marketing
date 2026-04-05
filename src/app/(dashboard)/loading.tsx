export default function DashboardLoading() {
  return (
    <div className="grid gap-6">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="surface-panel rounded-[36px] p-6 sm:p-8">
          <div className="skeleton h-6 w-40 rounded-full" />
          <div className="mt-6 space-y-3">
            <div className="skeleton h-12 w-full max-w-2xl rounded-[18px]" />
            <div className="skeleton h-12 w-3/4 rounded-[18px]" />
            <div className="skeleton h-5 w-full max-w-3xl rounded-full" />
            <div className="skeleton h-5 w-2/3 rounded-full" />
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="nested-panel rounded-[28px] p-4"
              >
                <div className="skeleton h-11 w-11 rounded-[18px]" />
                <div className="mt-4 skeleton h-6 w-3/4 rounded-full" />
                <div className="mt-3 space-y-2">
                  <div className="skeleton h-4 w-full rounded-full" />
                  <div className="skeleton h-4 w-5/6 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-panel rounded-[32px] p-6">
          <div className="skeleton h-6 w-48 rounded-full" />
          <div className="mt-5 grid gap-4">
            {[0, 1, 2].map((item) => (
              <div key={item} className="nested-panel rounded-[26px] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="skeleton h-6 w-24 rounded-full" />
                  <div className="skeleton h-5 w-16 rounded-full" />
                </div>
                <div className="mt-4 skeleton h-6 w-5/6 rounded-full" />
                <div className="mt-3 space-y-2">
                  <div className="skeleton h-4 w-full rounded-full" />
                  <div className="skeleton h-4 w-3/4 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="surface-panel rounded-[28px] p-5">
            <div className="skeleton h-4 w-28 rounded-full" />
            <div className="mt-5 skeleton h-10 w-24 rounded-[18px]" />
            <div className="mt-4 skeleton h-4 w-32 rounded-full" />
          </div>
        ))}
      </section>
    </div>
  );
}
